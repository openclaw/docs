---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم بوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل البوت المباشرة والمجموعات عبر grammY. وضع الاستطلاع الطويل هو الوضع الافتراضي؛ وضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح عملية.
  </Card>
  <Card title="تكوين Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لتكوين القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد من أن المعرّف هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع المطالبات، واحفظ الرمز.

  </Step>

  <Step title="كوّن الرمز وسياسة الرسائل المباشرة">

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

    بديل البيئة: `TELEGRAM_BOT_TOKEN=...` (الحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ كوّن الرمز في config/env، ثم ابدأ Gateway.

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
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و `groupPolicy` لمطابقة نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حل الرمز واعٍ بالحساب. عمليًا، تكون لقيم التكوين الأولوية على بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وظهور المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، وهو يحد من رسائل المجموعات التي تتلقاها.

    إذا كان يجب أن يرى البوت كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تتحكم إعدادات مجموعة Telegram في حالة المشرف.

    تتلقى بوتات المشرفين كل رسائل المجموعة، وهو مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather مفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو منعها
    - `/setprivacy` لسلوك ظهور المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد اسم مستخدم البوت أو يخمّنه أن يرسل أوامر إلى البوت. استخدمه فقط للبوتات العامة المقصودة ذات الأدوات المقيدة بإحكام؛ ينبغي أن تستخدم بوتات المالك الواحد `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئات `telegram:` / `tg:` وتُطبّع.
    في تكوينات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` التقييدي على المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا ما لم تظل قائمة السماح الفعلية للحساب تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة ويرفضه التحقق من صحة التكوين.
    يطلب الإعداد معرّفات المستخدمين الرقمية فقط.
    إذا قمت بالترقية وكان تكوينك يحتوي على إدخالات قائمة سماح `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (على سبيل المثال عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    لبوتات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` الرقمية الصريحة لإبقاء سياسة الوصول ثابتة في التكوين (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    لبس شائع: الموافقة على اقتران الرسائل المباشرة لا تعني "هذا المرسل مخول في كل مكان".
    يمنح الاقتران وصولًا إلى الرسائل المباشرة. إذا لم يكن مالك أوامر موجودًا بعد، فإن أول اقتران معتمد يضبط أيضًا `commands.ownerAllowFrom` بحيث يكون لأوامر المالك فقط وموافقات التنفيذ حساب مشغل صريح.
    لا يزال تفويض مرسل المجموعة يأتي من قوائم السماح الصريحة في التكوين.
    إذا أردت "أنا مخول مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ وبالنسبة لأوامر المالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (بلا بوت خارجي):

    1. أرسل رسالة مباشرة إلى بوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة خارجية (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعة وقوائم السماح">
    ينطبق عنصران للتحكم معًا:

    1. **أي المجموعات مسموح بها** (`channels.telegram.groups`)
       - لا يوجد تكوين `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم تكوين `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح لهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسل المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    ينبغي أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئات `telegram:` / `tg:`).
    لا تضع معرّفات محادثات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات المحادثات السالبة إلى `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسل المجموعة موافقات مخزن اقتران الرسائل المباشرة.
    يبقى الاقتران خاصًا بالرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في التكوين، لا إلى مخزن الاقتران.
    نمط عملي لبوتات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فتعتمد افتراضيات وقت التشغيل `groupPolicy="allowlist"` المغلقة آمنًا ما لم يتم ضبط `channels.defaults.groupPolicy` صراحة.

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

      - ضع معرّفات محادثات مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.

    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب ردود المجموعة إشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة `@botusername` أصلية، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح أوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تُحدّث هذه حالة الجلسة فقط. استخدم التكوين للاستمرارية.

    مثال تكوين مستمر:

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

    الحصول على معرّف محادثة المجموعة:

    - أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص `getUpdates` في Bot API

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يملك إجراء Gateway قناة Telegram.
- التوجيه حتمي: ترد رسائل Telegram الواردة إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى غلاف القناة المشترك مع بيانات تعريف الرد والعناصر النائبة للوسائط.
- تُعزل جلسات المجموعة حسب معرّف المجموعة. تضيف موضوعات المنتدى `:topic:<threadId>` للحفاظ على عزل الموضوعات.
- يمكن أن تحمل الرسائل المباشرة `message_thread_id`؛ يوجهها OpenClaw بمفاتيح جلسات واعية بالخيط ويحافظ على معرّف الخيط للردود.
- يستخدم الاستطلاع الطويل مشغّل grammY مع تسلسل لكل محادثة/خيط. يستخدم تزامن مصرف المشغّل الإجمالي `agents.defaults.maxConcurrent`.
- يُحرس الاستطلاع الطويل داخل كل إجراء Gateway بحيث يمكن لمستطلع نشط واحد فقط استخدام رمز بوت في وقت واحد. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستطلعًا خارجيًا يستخدم الرمز نفسه.
- تُشغَّل عمليات إعادة تشغيل مراقب الاستطلاع الطويل افتراضيًا بعد 120 ثانية دون حيوية `getUpdates` مكتملة. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرك لا يزال يرى عمليات إعادة تشغيل خاطئة بسبب توقف الاستطلاع أثناء عمل طويل التشغيل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث ردود جزئية في الوقت الفعلي:

    - المحادثات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (افتراضي: `partial`)
    - يُربط `progress` إلى `partial` على Telegram (توافق مع التسمية متعددة القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة المعدّلة نفسها (افتراضيًا: `true` عندما يكون بث المعاينة نشطًا)
    - يتم اكتشاف `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر "Working..." القصيرة المعروضة أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، أو ملخصات التصحيحات. يبقي Telegram هذه مفعلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده. للاحتفاظ بالمعاينة المعدّلة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطّل تعديلات معاينة Telegram ويُكبت ضجيج الأداة/التقدم العام بدلًا من إرساله كرسائل "Working..." مستقلة. لا تزال مطالبات الموافقة، وحمولات الوسائط، والأخطاء تُوجّه عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    للردود النصية فقط:

    - معاينات DM/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلاً نهائياً في مكانها
    - المعاينات الأقدم من نحو دقيقة واحدة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة ثم ينظف المعاينة، بحيث يعكس الطابع الزمني الظاهر في Telegram وقت الاكتمال بدلاً من وقت إنشاء المعاينة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عند تمكين بث الكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة المباشرة أثناء التوليد
    - يُرسل الجواب النهائي دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر Telegram `parse_mode: "HTML"`.

    - يُعرض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام من النموذج لتقليل فشل تحليل Telegram.
    - إذا رفض Telegram HTML المحلل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط ممكّنة افتراضياً ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    يُعالج تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

    - يفعّل `commands.native: "auto"` الأوامر الأصلية لـ Telegram

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

    - تُطبّع الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، الطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - تُتخطى التعارضات/التكرارات وتُسجل في السجل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائياً
    - يمكن أن تستمر أوامر plugin/skill في العمل عند كتابتها حتى إذا لم تظهر في قائمة Telegram

    إذا كانت الأوامر الأصلية معطلة، تُزال الأوامر المضمنة. قد تستمر أوامر custom/plugin في التسجيل إذا كانت مكوّنة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما زالت تتجاوز الحد بعد التشذيب؛ قلل أوامر plugin/skill/custom أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر Bot API curl المباشرة أن `channels.telegram.apiRoot` ضُبط على نقطة نهاية `/bot<TOKEN>` الكاملة. يجب أن يكون `apiRoot` هو جذر Bot API فقط، ويزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` العرضية.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المكوّن. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء، لذلك لا يُبلّغ عن ذلك كفشل في تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin `device-pair`)

    عند تثبيت Plugin `device-pair`:

    1. ينشئ `/pair` رمز الإعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يوجد طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. يبقي تسليم التمهيد المضمن رمز العقدة الأساسي عند `scopes: []`؛ ويبقى أي رمز مشغّل مُسلّم محدوداً بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تُسبَق فحوصات نطاق التمهيد بالدور، لذلك لا تلبي قائمة السماح الخاصة بالمشغّل إلا طلبات المشغّل؛ ما زالت الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفاً. أعد تشغيل `/pair pending` قبل الموافقة.

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

    تُمرر نقرات رد النداء إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أدوات Telegram:

    - `sendMessage` (`to`، `content`، اختياري `mediaUrl`، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، اختياري `iconColor`، `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء بديلة مريحة (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر التحكم بالبوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (افتراضي: معطل)

    ملاحظة: `edit` و`topic-create` ممكّنان حالياً افتراضياً ولا يملكان مفاتيح تبديل منفصلة `channels.telegram.actions.*`.
    تستخدم الإرسالات وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل ردود صريحة في الناتج المولّد:

    - يرد `[[reply_to_current]]` على الرسالة التي أطلقت العملية
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عند تمكين تسلسل الردود وتوفر نص Telegram الأصلي أو التعليق، يضمّن OpenClaw مقتطف اقتباس Telegram أصلياً تلقائياً. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطل `off` تسلسل الردود الضمني. ما زالت وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة الخاصة بالمنتديات:

    - تضيف مفاتيح جلسات المواضيع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة الموضوع
    - مسار إعداد الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف إرسالات الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - ما زالت إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    يكون `agentId` خاصاً بالموضوع فقط ولا يرث من افتراضيات المجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف بتعيين `agentId` في إعداد الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    يكون لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط موضوع ACP المستمر**: يمكن لمواضيع المنتدى تثبيت جلسات حاضنة ACP عبر ربطات ACP المكتوبة على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي محدود بمواضيع المنتديات في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالسلسلة من المحادثة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ تُوجّه المتابعات إليها مباشرة. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات DM التي تحتوي `message_thread_id` بتوجيه DM لكنها تستخدم مفاتيح جلسات واعية بالسلاسل.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطّر نصوص الملاحظات الصوتية الواردة كنص مولّد آلياً
      وغير موثوق في سياق الوكيل؛ ما زال اكتشاف الإشارة يستخدم النص الخام
      بحيث تستمر رسائل الصوت المحكومة بالإشارة في العمل.

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

    لا تدعم ملاحظات الفيديو التعليقات؛ يُرسل نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزّل ويُعالج (العنصر النائب `<media:sticker>`)
    - TGS متحرك: يُتخطى
    - WEBM فيديو: يُتخطى

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة التخزين المؤقت للملصقات:

    - `~/.openclaw/telegram/sticker-cache.json`

    تُوصف الملصقات مرة واحدة (عند الإمكان) وتُخزن مؤقتاً لتقليل استدعاءات الرؤية المتكررة.

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

    ابحث في الملصقات المخزنة مؤقتاً:

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

    عند التمكين، يضع OpenClaw أحداث النظام في الطابور مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (افتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (افتراضي: `minimal`)

    ملاحظات:

    - يعني `own` تفاعلات المستخدم مع الرسائل التي أرسلها البوت فقط (بأفضل جهد عبر ذاكرة تخزين الرسائل المرسلة).
    - لا تزال أحداث التفاعل تراعي ضوابط وصول Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ يتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرّفات السلاسل في تحديثات التفاعل.
      - تُوجّه المجموعات غير المنتدية إلى جلسة دردشة المجموعة
      - تُوجّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/الـwebhook `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحسم:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع الاحتياطي إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رمزًا تعبيريًا بصيغة يونيكود (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعداد من أحداث وأوامر Telegram">
    تكون كتابات إعداد القناة ممكّنة افتراضيًا (`configWrites !== false`).

    تشمل الكتابات التي يطلقها Telegram:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلب تمكين الأمر)

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

  <Accordion title="الاستقصاء الطويل مقابل الـwebhook">
    الافتراضي هو الاستقصاء الطويل. لوضع الـwebhook عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ واختياريًا `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    يرتبط المستمع المحلي بـ`127.0.0.1:8787`. للوصول العام، إما أن تضع وكيلًا عكسيًا أمام المنفذ المحلي أو تعيّن `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع الـwebhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إعادة `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل دردشة/لكل موضوع المستخدمة في الاستقصاء الطويل، لذلك لا تحتجز دورات الوكيل البطيئة إقرار التسليم من Telegram.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ`channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدد `channels.telegram.mediaMaxMb` (الافتراضي 100) حد حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُعيّن، ينطبق افتراضي grammY). تقيّد عملاء البوت في الاستقصاء الطويل القيم المضبوطة التي تقل عن حارس طلب `getUpdates` البالغ 45 ثانية حتى لا تُجهض عمليات الاستقصاء الخاملة قبل اكتمال نافذة الاستقصاء البالغة 30 ثانية.
    - القيمة الافتراضية لـ`channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لإعادة تشغيل توقف الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ يعطّل `0` ذلك.
    - يُمرر السياق الإضافي للرد/الاقتباس/إعادة التوجيه حاليًا كما استُلم.
    - تتحكم قوائم السماح في Telegram أساسًا بمن يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدين إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة إرسال آمنة ومحدودة لإخفاقات ما قبل اتصال Telegram، لكنه لا يعيد محاولة أغلفة الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن يكون هدف إرسال CLI معرّف دردشة رقميًا أو اسم مستخدم:

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

    أعلام الاستطلاع الخاصة بـTelegram فقط:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات مفاتيح مضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يعطّل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يعطّل `channels.telegram.actions.poll=false` إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي ممكّنًا

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمين رقمية في Telegram.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يُفعّل تلقائيًا عندما يكون هناك موافق واحد على الأقل قابل للحل)
    - `channels.telegram.execApprovals.approvers` (يرجع احتياطيًا إلى معرّفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (افتراضي) | `channel` | `both`
    - `agentFilter`، `sessionFilter`

    يتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` بمن يمكنه التحدث إلى البوت ومكان إرسال الردود العادية. إنها لا تجعل شخصًا ما موافقًا على التنفيذ. تؤسس أول عملية إقران رسائل مباشرة موافق عليها `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذلك يظل إعداد المالك الواحد يعمل دون تكرار المعرّفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في الدردشة؛ لا تمكّن `channel` أو `both` إلا في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة المسبوقة بـ`plugin:` عبر موافقات Plugin؛ أما الأخرى فتُحل عبر موافقات التنفيذ أولًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ تسليم أو خطأ موفّر، يمكن لـTelegram إما الرد بنص الخطأ أو كبته. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                         |
| ----------------------------------- | ----------------- | --------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى الدردشة. يكبت `silent` ردود الأخطاء بالكامل.                 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع رسائل الخطأ المزعجة أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب ولكل مجموعة ولكل موضوع (بالوراثة نفسها مثل مفاتيح إعداد Telegram الأخرى).

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
  <Accordion title="لا يستجيب البوت لرسائل المجموعة التي لا تتضمن إشارة">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت من المجموعة وأعد إضافته
    - يحذّر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة غير متضمنة لإشارة.
    - يمكن لـ`openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ لا يمكن فحص العضوية للبدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة مطلقًا">

    - عندما يوجد `channels.telegram.groups`، يجب أن تكون المجموعة مدرجة (أو تتضمن `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل مطلقًا">

    - خوّل هوية المرسل الخاصة بك (الإقران و/أو `allowFrom` الرقمي)
    - يظل تفويض الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني فشل `setMyCommands` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدًا؛ قلل أوامر Plugin/Skills/المخصصة أو عطّل القوائم الأصلية
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` محدودة وتعيد المحاولة مرة واحدة عبر رجوع نقل Telegram الاحتياطي عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادةً إلى مشكلات في قابلية الوصول إلى DNS/HTTPS لـ`api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلغ عن رمز غير مصرّح به">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز البوت المضبوط.
    - أعد نسخ رمز البوت أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضًا فشل مصادقة؛ معاملته على أنه "لا يوجد webhook" لن يؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API اللاحقة.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء الاستقصاء، يفحص OpenClaw `getWebhookInfo`؛ عندما يبلغ Telegram عن عنوان URL فارغ للـwebhook، يستمر الاستقصاء لأن التنظيف مُستوفى بالفعل.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/وكيل مخصص إلى سلوك إلغاء فوري إذا لم تتطابق أنواع AbortSignal.
    - بعض المضيفين يحلون `api.telegram.org` إلى IPv6 أولا؛ وقد يؤدي خروج IPv6 المعطل إلى إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء باعتبارها أخطاء شبكة قابلة للاسترداد.
    - إذا كانت مقابس Telegram يعاد تدويرها وفق وتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ عملاء البوت الذين يستخدمون الاستقصاء الطويل يثبتون القيم المكونة تحت حد حماية طلب `getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تلغي كل استقصاء عندما كانت هذه القيمة مضبوطة تحت مهلة الاستقصاء الطويل.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية بدون اكتمال حيوية الاستقصاء الطويل افتراضيا.
    - يحذر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد مهلة السماح عند بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة السماح عند بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستقصاء قديما.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` الطويلة التشغيل سليمة لكن مضيفك لا يزال يبلغ عن عمليات إعادة تشغيل كاذبة بسبب توقف الاستقصاء. تشير حالات التوقف المستمرة عادة إلى مشكلات وكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يحترم Telegram أيضا بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` ومتغيراتها ذات الأحرف الصغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان وكيل OpenClaw المدار مكونا عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولم تكن بيئة وكيل قياسية موجودة، يستخدم Telegram عنوان URL ذلك لنقل Bot API أيضا.
    - على مضيفي VPS ذوي خروج/TLS مباشر غير مستقر، وجه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضيا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحة بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق معيار RFC 2544 (`198.18.0.0/15`) مسموح بها مسبقا
      لتنزيلات وسائط Telegram افتراضيا. إذا أعاد fake-IP موثوق أو
      وكيل شفاف كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/خاص الاستخدام أثناء تنزيلات الوسائط، يمكنك الاشتراك
      في التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب في
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان وكيلك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلم الخطر معطلا أولا. تسمح وسائط Telegram بالفعل بنطاق معيار
      RFC 2544 افتراضيا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حمايات
      SSRF لوسائط Telegram. استخدمه فقط لبيئات الوكيل الموثوقة الخاضعة لتحكم
      المشغل مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما
      تنشئ إجابات خاصة أو خاصة الاستخدام خارج نطاق معيار RFC 2544.
      اتركه معطلا للوصول العادي إلى Telegram عبر الإنترنت العام.
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

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ ترفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, المستوى الأعلى `bindings[]` (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- التسلسل/الردود: `replyToMode`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تكوين معرفي حسابين أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحا. وإلا يعود OpenClaw إلى أول معرف حساب مطبع ويحذر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    أقرن مستخدم Telegram مع Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والموضوعات.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
