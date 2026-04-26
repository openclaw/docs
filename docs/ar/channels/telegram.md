---
read_when:
    - العمل على ميزات Telegram أو Webhookات
summary: حالة دعم Telegram bot وإمكاناته وإعداداته
title: Telegram
x-i18n:
    generated_at: "2026-04-26T11:24:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7d269b15bc2d377fa45f0516e435517ed366c0216d0bc31fe4f4bc080a6c726
    source_path: channels/telegram.md
    workflow: 15
---

جاهز للإنتاج لرسائل bot الخاصة والمجموعات عبر grammY. وضع long polling هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة DM الافتراضية في Telegram هي الإقران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات مشتركة بين القنوات وأدلة إصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعدادات القنوات.
  </Card>
</CardGroup>

## إعداد سريع

<Steps>
  <Step title="أنشئ bot token في BotFather">
    افتح Telegram وابدأ محادثة مع **@BotFather** (تأكد أن المعرّف هو `@BotFather` تمامًا).

    شغّل `/newbot`، واتبع التعليمات، واحفظ الـ token.

  </Step>

  <Step title="اضبط الـ token وسياسة الرسائل الخاصة DM">

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

    البديل عبر البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`; اضبط الـ token في config/env، ثم ابدأ gateway.

  </Step>

  <Step title="ابدأ gateway ووافق على أول رسالة خاصة DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الإقران بعد ساعة واحدة.

  </Step>

  <Step title="أضف الـ bot إلى مجموعة">
    أضف الـ bot إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يتوافق مع نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حلّ الـ token يعتمد على الحساب. عمليًا، تفوز قيم config على البديل عبر env، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعات">
    تستخدم bots في Telegram **Privacy Mode** افتراضيًا، ما يحد من رسائل المجموعات التي تتلقاها.

    إذا كان يجب أن يرى الـ bot كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل الـ bot مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل الـ bot ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    يتم التحكم في حالة المشرف من إعدادات مجموعة Telegram.

    تستقبل bots المشرفة كل رسائل المجموعة، وهو ما يفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="خيارات BotFather المفيدة">

    - `/setjoingroups` للسماح/المنع من الإضافة إلى المجموعات
    - `/setprivacy` لسلوك رؤية المجموعات

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل الخاصة DM">
    يتحكم `channels.telegram.dmPolicy` في وصول الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب وجود معرّف مرسل واحد على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `channels.telegram.allowFrom` معرّفات مستخدم Telegram الرقمية. يتم قبول البادئات `telegram:` / `tg:` وتطبيعها.
    تؤدي `dmPolicy: "allowlist"` مع `allowFrom` فارغة إلى حظر جميع الرسائل الخاصة DM ويتم رفضها بواسطة التحقق من صحة الإعدادات.
    يطلب الإعداد معرّفات مستخدم رقمية فقط.
    إذا قمت بالترقية وكان config لديك يحتوي على إدخالات allowlist من نوع `@username`، شغّل `openclaw doctor --fix` لحلّها (best-effort؛ ويتطلب Telegram bot token).
    إذا كنت تعتمد سابقًا على ملفات allowlist الخاصة بمخزن الإقران، فيمكن لـ `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات allowlist (على سبيل المثال عندما تكون `dmPolicy: "allowlist"` بلا معرّفات صريحة بعد).

    بالنسبة إلى bots ذات المالك الواحد، يُفضَّل استخدام `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة وصول دائمة في config (بدلًا من الاعتماد على موافقات إقران سابقة).

    التباس شائع: موافقة إقران الرسائل الخاصة DM لا تعني أن "هذا المرسل مخوّل في كل مكان".
    يمنح الإقران وصول الرسائل الخاصة DM فقط. ويظل تفويض مرسل المجموعة صادرًا من allowlists الصريحة في config.
    إذا كنت تريد "أن أكون مخوّلًا مرة واحدة وأن تعمل كل من الرسائل الخاصة وأوامر المجموعات"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (من دون bot تابع لجهة خارجية):

    1. أرسل رسالة خاصة DM إلى bot الخاص بك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة جهة خارجية (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وallowlists">
    يُطبَّق عنصران تحكم معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - بدون config لـ `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - عند تكوين `groups`: تعمل بوصفها allowlist (معرّفات صريحة أو `"*"`)

    2. **ما المرسلين المسموح لهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. وإذا لم يتم ضبطه، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدم Telegram رقمية (ويتم تطبيع بادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعات Telegram أو supergroup في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة إلى `channels.telegram.groups`.
    يتم تجاهل الإدخالات غير الرقمية لتفويض المرسل.
    الحد الأمني (`2026.2.25+`): لا يرث تفويض مرسل المجموعة موافقات مخزن إقران الرسائل الخاصة DM.
    يظل الإقران خاصًا بالرسائل الخاصة DM فقط. بالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يتم ضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في config، وليس إلى مخزن الإقران.
    النمط العملي لـ bots ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كانت `channels.telegram` مفقودة بالكامل، فإن وقت التشغيل يستخدم افتراضيًا وضع fail-closed مع `groupPolicy="allowlist"` ما لم يتم ضبط `channels.defaults.groupPolicy` صراحةً.

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
      خطأ شائع: `groupAllowFrom` ليس allowlist لمجموعات Telegram.

      - ضع معرّفات مجموعات Telegram أو supergroup السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل الـ bot.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى الـ bot.
    </Warning>

  </Tab>

  <Tab title="سلوك الإشارات">
    تتطلب الردود في المجموعات إشارة mention افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية `@botusername`، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    أوامر التبديل على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه الأوامر حالة الجلسة فقط. استخدم config من أجل الاستمرارية.

    مثال على config دائم:

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

- يملك Telegram عملية gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (ولا يختار النموذج القنوات).
- تُطبَّع الرسائل الواردة إلى الغلاف المشترك للقنوات مع بيانات الرد الوصفية وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. وتضيف موضوعات المنتدى اللاحقة `:topic:<threadId>` للحفاظ على عزل الموضوعات.
- يمكن أن تحمل رسائل DM قيمة `message_thread_id`؛ ويقوم OpenClaw بتوجيهها باستخدام مفاتيح جلسات مدركة للخيوط ويحافظ على معرّف الخيط للردود.
- يستخدم long polling المشغّل grammY runner مع تسلسل لكل دردشة/لكل خيط. ويستخدم التزامن العام لمصرف المشغّل `agents.defaults.maxConcurrent`.
- تتم حماية long polling داخل كل عملية gateway بحيث لا يتمكن إلا poller نشط واحد من استخدام bot token في الوقت نفسه. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المحتمل أن تكون هناك gateway أخرى لـ OpenClaw، أو سكربت، أو poller خارجي يستخدم الـ token نفسه.
- تُفعَّل عمليات إعادة تشغيل مراقب long-polling بعد 120 ثانية من دون حيوية مكتملة لـ `getUpdates` افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كانت بيئتك لا تزال تشهد عمليات إعادة تشغيل خاطئة بسبب تعثر polling أثناء العمل الطويل. القيمة بالميلي ثانية، ويُسمح بها من `30000` إلى `600000`؛ كما أن التجاوزات لكل حساب مدعومة.
- لا تدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث ردود جزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يتم تعيين `progress` إلى `partial` على Telegram (للتوافق مع التسمية عبر القنوات)
    - يتحكم `streaming.preview.toolProgress` في ما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة المعدلة نفسها (الافتراضي: `true` عندما تكون معاينة البث نشطة)
    - يتم اكتشاف `channels.telegram.streamMode` القديم وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر "Working..." القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، أو ملخصات التصحيح. يبقي Telegram هذه الميزة مفعّلة افتراضيًا لتتوافق مع سلوك OpenClaw المُطلق من `v2026.4.22` وما بعده. إذا كنت تريد الإبقاء على المعاينة المعدّلة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، فاضبط ما يلي:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تعطيل تعديلات معاينة Telegram بالكامل. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط تعطيل أسطر حالة تقدم الأدوات.

    بالنسبة إلى الردود النصية فقط:

    - DM: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)
    - المجموعة/الموضوع: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (من دون رسالة ثانية)

    بالنسبة إلى الردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظّف رسالة المعاينة.

    بث المعاينة منفصل عن block streaming. عندما يتم تمكين block streaming صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودة الأصلي غير متاح/مرفوضًا، يعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث reasoning الخاص بـ Telegram فقط:

    - `/reasoning stream` يرسل reasoning إلى المعاينة المباشرة أثناء التوليد
    - تُرسل الإجابة النهائية من دون نص reasoning

  </Accordion>

  <Accordion title="التنسيق والبديل الاحتياطي HTML">
    يستخدم النص الصادر في Telegram القيمة `parse_mode: "HTML"`.

    - يتم عرض النص الشبيه بـ Markdown بصيغة HTML آمنة لـ Telegram.
    - يتم تهريب HTML الخام الصادر من النموذج لتقليل أخطاء التحليل في Telegram.
    - إذا رفض Telegram HTML المحلَّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعّلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    القيم الافتراضية للأوامر الأصلية:

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

    - تتم تسوية الأسماء (إزالة `/` من البداية، وأحرف صغيرة)
    - النمط الصالح: `a-z` و`0-9` و`_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفّذ السلوك تلقائيًا
    - لا تزال أوامر Plugin/Skills تعمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، تتم إزالة الأوامر المضمنة. وقد تظل أوامر custom/plugin تُسجَّل إذا كانت مكوّنة.

    إخفاقات الإعداد الشائعة:

    - يعني الخطأ `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما زالت متجاوزة للحد بعد التقليص؛ قلّل أوامر plugin/skill/custom أو عطّل `channels.telegram.commands.native`.
    - يعني الخطأ `setMyCommands failed` مع أخطاء الشبكة/fetch عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (`device-pair` plugin)

    عند تثبيت `device-pair` plugin:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلّقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلّق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد bootstrap token قصير العمر. يحافظ تسليم bootstrap المدمج على primary node token عند `scopes: []`؛ وأي operator token يتم تسليمه يظل مقيّدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق bootstrap مسبوقة بالدور، لذا فإن allowlist الخاصة بالمشغّل تلبّي طلبات المشغّل فقط؛ وما زالت الأدوار غير التابعة للمشغّل تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيّرة (مثل الدور/النطاقات/المفتاح العام)، يتم استبدال الطلب المعلّق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [Pairing](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    تُحوَّل الصيغة القديمة `capabilities: ["inlineButtons"]` إلى `inlineButtons: "all"`.

    مثال إجراء رسالة:

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

    يتم تمرير نقرات callback إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram ما يلي:

    - `sendMessage` (`to`, `content`, اختياري `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, اختياري `iconColor`, `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء مستعارة مريحة (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطّل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل منفصلة من نوع `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل اللقطة النشطة من config/secrets (بدء التشغيل/إعادة التحميل)، لذلك لا تنفّذ مسارات الإجراءات إعادة حلّ SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم ترابط الردود">
    يدعم Telegram وسومًا صريحة لترابط الردود في المخرجات المُولَّدة:

    - `[[reply_to_current]]` للرد على الرسالة المُشغِّلة
    - `[[reply_to:<id>]]` للرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    عند تمكين ترابط الردود وتوفر النص الأصلي أو التسمية التوضيحية الأصلية في Telegram، يضمّن OpenClaw تلقائيًا مقتطف اقتباس أصليًا من Telegram. يقيّد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذا تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يؤدي `off` إلى تعطيل ترابط الردود الضمني. ولا تزال وسوم `[[reply_to_*]]` الصريحة مُعتمدة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك الخيوط">
    في مجموعات supergroups الخاصة بالمنتدى:

    - تضيف مفاتيح جلسة الموضوع اللاحقة `:topic:<threadId>`
    - تستهدف الردود والكتابة خيط الموضوع
    - مسار إعداد الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل قيمة `message_thread_id` (يرفض Telegram ‎`sendMessage(...thread_id=1)`‎)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوعات: ترث إدخالات الموضوعات إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من الإعدادات الافتراضية للمجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف من خلال ضبط `agentId` في إعدادات الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // الموضوع العام → الوكيل الرئيسي
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

    **ربط دائم لموضوع ACP**: يمكن لموضوعات المنتدى تثبيت جلسات ACP harness من خلال ACP bindings مكتوبة من المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). يقتصر ذلك حاليًا على موضوعات المنتدى في المجموعات/supergroups. راجع [ACP Agents](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالخيط من الدردشة**: يقوم `/acp spawn <agent> --thread here|auto` بربط الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب ذلك `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يكشف سياق القالب عن `MessageThreadId` و`IsForum`. وتحافظ دردشات DM التي تحتوي على `message_thread_id` على توجيه DM لكنها تستخدم مفاتيح جلسات مدركة للخيوط.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطَّر نصوص تفريغ الملاحظات الصوتية الواردة كنص مولَّد آليًا وغير موثوق
      به داخل سياق الوكيل؛ ولا يزال اكتشاف الإشارات يستخدم النص الخام
      للتفريغ حتى تستمر الرسائل الصوتية المقيّدة بالإشارات في العمل.

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويُرسل نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    التعامل مع الملصقات الواردة:

    - WEBP ثابت: يتم تنزيله ومعالجته (عنصر نائب `<media:sticker>`)
    - TGS متحرك: يتم تخطيه
    - WEBM فيديو: يتم تخطيه

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف cache للملصقات:

    - `~/.openclaw/telegram/sticker-cache.json`

    يتم وصف الملصقات مرة واحدة (عندما يكون ذلك ممكنًا) وتُخزَّن مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

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
  query: "قط يلوّح",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التمكين، يضيف OpenClaw إلى قائمة الانتظار أحداث نظام مثل:

    - `تمت إضافة تفاعل Telegram: 👍 بواسطة Alice (@alice) على الرسالة 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدمين على الرسائل التي أرسلها الـ bot فقط (best-effort عبر cache الرسائل المرسلة).
    - لا تزال أحداث التفاعل تحترم عناصر التحكم في وصول Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); ويتم إسقاط المرسلين غير المخوّلين.
    - لا يوفّر Telegram معرّفات خيوط في تحديثات التفاعلات.
      - تُوجَّه المجموعات غير التابعة للمنتدى إلى جلسة دردشة المجموعة
      - تُوجَّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` لكل من polling/webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحلّ:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل emoji لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموز emoji موحّدة (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات config من أحداث وأوامر Telegram">
    تكون كتابات إعدادات القناة مفعّلة افتراضيًا (`configWrites !== false`).

    تتضمن الكتابات التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلبان تمكين الأوامر)

    تعطيل:

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

  <Accordion title="Long polling مقابل Webhook">
    الوضع الافتراضي هو long polling. لاستخدام وضع Webhook اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ والخيارات الاختيارية هي `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية: `/telegram-webhook` و`127.0.0.1` و`8787`).

    يستمع المستمع المحلي على `127.0.0.1:8787`. وللإدخال العام، إمّا أن تضع reverse proxy أمام المنفذ المحلي أو تضبط `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حواجز حماية الطلب، وsecret token الخاص بـ Telegram، وجسم JSON قبل إعادة `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات bot نفسها لكل دردشة/لكل موضوع المستخدمة في long polling، بحيث لا تؤدي أدوار الوكيل البطيئة إلى حجز ACK التسليم الخاص بـ Telegram.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدد `channels.telegram.mediaMaxMb` (الافتراضي 100) الحد الأقصى لحجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم تُضبط، تُطبَّق القيمة الافتراضية لـ grammY).
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل تعثر polling الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله القيمة `0`.
    - يُمرَّر حاليًا سياق الرد/الاقتباس/إعادة التوجيه الإضافي كما تم استلامه.
    - تتحكم allowlists في Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.
    - عناصر التحكم في سجل الرسائل الخاصة DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات الإرسال في Telegram (CLI/tools/actions) لأخطاء API الصادرة القابلة للاسترداد.

    يمكن أن يكون هدف الإرسال في CLI معرّف دردشة رقميًا أو اسم مستخدم:

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

    إشارات الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (من 5 إلى 600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدفًا من نوع `:topic:`)

    يدعم الإرسال في Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يتمكن الـ bot من التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع الإبقاء على الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل الخاصة DM الخاصة بالموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدم Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يتم تمكينه تلقائيًا عندما يكون هناك موافق واحد على الأقل قابل للحل)
    - `channels.telegram.execApprovals.approvers` (يعود إلى معرّفات المالك الرقمية من `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    يعرض التسليم عبر القناة نص الأمر في الدردشة؛ لذا لا تمكّن `channel` أو `both` إلا في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع نفسه لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح المستهدف (`dm` أو `group` أو `all`). تُحلّ معرّفات الموافقة المسبوقة بـ `plugin:` عبر موافقات Plugin؛ بينما تُحلّ المعرفات الأخرى عبر موافقات exec أولًا.

    راجع [Exec approvals](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو من المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح | القيم | الافتراضي | الوصف |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy` | `reply`, `silent` | `reply` | يرسل `reply` رسالة خطأ ودية إلى الدردشة. بينما يمنع `silent` ردود الأخطاء بالكامل. |
| `channels.telegram.errorCooldownMs` | رقم (مللي ثانية) | `60000` | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع إغراق الأخطاء أثناء الانقطاعات. |

تُدعَم تجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس آلية الوراثة لمفاتيح إعداد Telegram الأخرى).

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
  <Accordion title="الـ bot لا يرد على رسائل المجموعة غير المحتوية على إشارة">

    - إذا كانت `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> تعطيل
      - ثم أزل الـ bot وأعد إضافته إلى المجموعة
    - يحذّر `openclaw channels status` عندما يتوقع config رسائل مجموعة بلا إشارة.
    - يمكن لـ `openclaw channels status --probe` التحقق من معرّفات مجموعات رقمية صريحة؛ ولا يمكن اختبار العضوية للمطابقة الشاملة `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="الـ bot لا يرى رسائل المجموعات إطلاقًا">

    - عند وجود `channels.telegram.groups`، يجب أن تكون المجموعة مدرجة (أو تتضمن `"*"`)
    - تحقّق من عضوية الـ bot في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المرسل الخاصة بك (الإقران و/أو `allowFrom` الرقمي)
    - يظل تفويض الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر plugin/skill/custom أو عطّل القوائم الأصلية
    - يشير `setMyCommands failed` مع أخطاء الشبكة/fetch عادةً إلى مشكلات في الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="عدم استقرار polling أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/proxy مخصص إلى سلوك إيقاف فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ ويمكن أن يؤدي خروج IPv6 المعطّل إلى فشل متقطع في Telegram API.
    - إذا احتوت السجلات على `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، يعيد OpenClaw الآن محاولة هذه الحالات كأخطاء شبكة قابلة للاسترداد.
    - إذا احتوت السجلات على `Polling stall detected`، يعيد OpenClaw تشغيل polling ويعيد بناء نقل Telegram بعد 120 ثانية من دون حيوية long-poll مكتملة افتراضيًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة لكن مضيفك ما زال يبلغ عن إعادة تشغيل خاطئة لتعثر polling. تشير حالات التعثر المستمرة عادةً إلى مشكلات proxy أو DNS أو IPv6 أو TLS في الخروج بين المضيف و`api.telegram.org`.
    - على مضيفات VPS ذات الخروج/TLS المباشر غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك هو WSL2 أو كان يعمل بشكل أفضل صراحةً مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - الإجابات ضمن نطاق RFC 2544 المخصّص للقياس (`198.18.0.0/15`) مسموح بها بالفعل
      افتراضيًا لتنزيلات وسائط Telegram. إذا أعاد fake-IP موثوق أو
      transparent proxy كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/ذو استخدام خاص أثناء تنزيلات الوسائط، فيمكنك
      التمكين الاختياري للتجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر التمكين الاختياري نفسه لكل حساب في
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطِرة معطلة أولًا. فوسائط Telegram تسمح بالفعل بنطاق RFC 2544
      الخاص بالقياس افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حماية SSRF
      الخاصة بوسائط Telegram. استخدمه فقط في بيئات proxy موثوقة وخاضعة لتحكم المشغل
      مثل Clash أو Mihomo أو توجيه fake-IP في Surge عندما
      تقوم هذه البيئات بتوليف إجابات خاصة أو ذات استخدام خاص خارج نطاق القياس
      RFC 2544. اتركه معطّلًا للوصول الطبيعي إلى Telegram عبر الإنترنت العام.
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

مزيد من المساعدة: [Channel troubleshooting](/ar/channels/troubleshooting).

## مرجع الإعدادات

المرجع الأساسي: [Configuration reference - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ وتُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات exec: `execApprovals`, `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- الخيوط/الردود: `replyToMode`
- البث: `streaming` (المعاينة), `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أولوية الحسابات المتعددة: عند تكوين معرّفي حساب أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. خلاف ذلك، يعود OpenClaw إلى أول معرّف حساب مطبّع ويصدر `openclaw doctor` تحذيرًا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    إقران مستخدم Telegram مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك allowlist للمجموعات والموضوعات.
  </Card>
  <Card title="توجيه القناة" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتحصين.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    ربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات مشتركة بين القنوات.
  </Card>
</CardGroup>
