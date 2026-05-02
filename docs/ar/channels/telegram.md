---
read_when:
    - العمل على ميزات Telegram أو عمليات Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-02T07:19:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: af04e95d6011ab568e07c309bc7c154d9242a53e24b7f52a2381dbf30ed842a0
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل البوت المباشرة والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ وضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وخطط إصلاح.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة تكوين القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="Create the bot token in BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد من أن المعرّف هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع التعليمات، واحفظ الرمز المميز.

  </Step>

  <Step title="Configure token and DM policy">

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

    خيار env الاحتياطي: `TELEGRAM_BOT_TOKEN=...` (الحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ كوّن الرمز المميز في config/env، ثم ابدأ Gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="Add the bot to a group">
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يطابق نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حلّ الرموز المميزة واعٍ بالحساب. عمليًا، تتغلب قيم config على خيار env الاحتياطي، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    تعتمد بوتات Telegram افتراضيًا على **وضع الخصوصية**، وهو يحدّ مما تتلقاه من رسائل المجموعات.

    إذا كان يجب أن يرى البوت كل رسائل المجموعة، فإما أن:

    - تعطّل وضع الخصوصية عبر `/setprivacy`، أو
    - تجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="Group permissions">
    تُدار حالة المشرف في إعدادات مجموعة Telegram.

    تتلقى بوتات المشرفين كل رسائل المجموعة، وهذا مفيد لسلوك المجموعات دائم التشغيل.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك الظهور في المجموعات

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.telegram.dmPolicy` في الوصول عبر الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد اسم مستخدم البوت أو يخمّنه أن يصدر أوامر للبوت. استخدمه فقط للبوتات العامة عمدًا مع أدوات مقيّدة بإحكام؛ يجب أن تستخدم بوتات المالك الواحد `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل بادئتا `telegram:` / `tg:` وتُطبّعان.
    في تكوينات متعددة الحسابات، يُعامل `channels.telegram.allowFrom` العلوي المقيّد كحد أمان: إدخالات مستوى الحساب `allowFrom: ["*"]` لا تجعل ذلك الحساب عامًا إلا إذا كانت allowlist الفعالة للحساب لا تزال تحتوي على wildcard صريح بعد الدمج.
    يمنع `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة ويرفضه تحقق config.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا قمت بالترقية وكان config لديك يحتوي على إدخالات allowlist بصيغة `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات allowlist في مخزن الاقتران، يمكن أن يستعيد `openclaw doctor --fix` الإدخالات إلى `channels.telegram.allowFrom` في تدفقات allowlist (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    لبوتات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول ثابتة في config (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    التباس شائع: موافقة اقتران الرسائل المباشرة لا تعني "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران وصول الرسائل المباشرة. إذا لم يكن هناك مالك أوامر بعد، فإن أول اقتران معتمد يضبط أيضًا `commands.ownerAllowFrom` بحيث تكون للأوامر الخاصة بالمالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تفويض مرسل المجموعة يأتي من قوائم allowlist صريحة في config.
    إذا أردت "أنا مخوّل مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي لديك في `channels.telegram.allowFrom`؛ وللأوامر الخاصة بالمالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram لديك

    أكثر أمانًا (بدون بوت طرف ثالث):

    1. أرسل رسالة مباشرة إلى بوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة طرف ثالث (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    ينطبق عنصران للتحكم معًا:

    1. **أي مجموعات مسموح بها** (`channels.telegram.groups`)
       - لا يوجد config لـ `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم تكوين `groups`: تعمل كـ allowlist (معرّفات صريحة أو `"*"`)

    2. **أي مرسلين مسموح بهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع بادئتا `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة تحت `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسلين.
    حد الأمان (`2026.2.25+`): مصادقة مرسل المجموعة لا ترث موافقات مخزن الاقتران للرسائل المباشرة.
    يبقى الاقتران خاصًا بالرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في config، وليس إلى مخزن الاقتران.
    نمط عملي لبوتات المالك الواحد: ضع معرّف مستخدمك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة runtime: إذا كان `channels.telegram` مفقودًا تمامًا، فإن افتراضات runtime تكون مغلقة آمنًا `groupPolicy="allowlist"` ما لم يُضبط `channels.defaults.groupPolicy` صراحة.

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

      - ضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` تحت `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تحديد من يمكنه داخل مجموعة مسموح بها تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    تتطلب ردود المجموعات ذكر البوت افتراضيًا.

    يمكن أن يأتي الذكر من:

    - ذكر أصلي بصيغة `@botusername`، أو
    - أنماط الذكر في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    تبديلات الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه حالة الجلسة فقط. استخدم config للاستمرارية.

    مثال config دائم:

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

    - إعادة توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو قراءة `chat.id` من `openclaw logs --follow`
    - أو فحص Bot API `getUpdates`

  </Tab>
</Tabs>

## سلوك Runtime

- يملك Gateway عملية Telegram.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى مغلف القناة المشترك مع بيانات وصفية للرد وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف مواضيع المنتديات `:topic:<threadId>` لإبقاء المواضيع معزولة.
- يمكن أن تحمل رسائل الرسائل المباشرة `message_thread_id`؛ يوجّه OpenClaw هذه الرسائل بمفاتيح جلسات واعية بالخيط ويحافظ على معرّف الخيط للردود.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل دردشة/خيط. يستخدم تزامن مصرف المشغّل العام `agents.defaults.maxConcurrent`.
- يُحمى الاستقصاء الطويل داخل كل عملية Gateway بحيث يمكن لمستقصٍ نشط واحد فقط استخدام رمز بوت في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر لـ OpenClaw أو سكربتًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تبدأ إعادات تشغيل مراقب الاستقصاء الطويل بعد 120 ثانية دون اكتمال حيوية `getUpdates` افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان النشر لديك لا يزال يرى إعادات تشغيل خاطئة بسبب توقف الاستقصاء أثناء عمل طويل. القيمة بالمللي ثانية ويُسمح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الحقيقي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يُطابق `progress` إلى `partial` على Telegram (توافقًا مع التسمية متعددة القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المعدّلة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - تُكتشف قيم `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر "Working..." القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، قراءة الملفات، تحديثات التخطيط، أو ملخصات التصحيحات. يُبقي Telegram هذه مفعّلة افتراضيًا لمطابقة سلوك OpenClaw المُصدَر من `v2026.4.22` وما بعده. للحفاظ على المعاينة المعدّلة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطّل تعديلات معاينة Telegram ويُكبت ثرثرة الأدوات/التقدم العامة بدلًا من إرسالها كرسائل "Working..." مستقلة. لا تزال مطالبات الموافقة، وحمولات الوسائط، والأخطاء تُوجّه عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    للردود النصية فقط:

    - معاينات الرسائل الخاصة/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلاً نهائياً في مكانها
    - المعاينات الأقدم من نحو دقيقة واحدة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة ثم ينظف المعاينة، بحيث يعكس الطابع الزمني الظاهر في Telegram وقت الاكتمال بدلاً من وقت إنشاء المعاينة

    بالنسبة للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عند تمكين بث الكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة المباشرة أثناء التوليد
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر في Telegram `parse_mode: "HTML"`.

    - يُعرَض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - يُهرَّب HTML الخام من النموذج لتقليل إخفاقات تحليل Telegram.
    - إذا رفض Telegram تحليل HTML، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضياً ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تُدار عملية تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

    - يفعّل `commands.native: "auto"` الأوامر الأصلية لـ Telegram

    أضف إدخالات أوامر مخصصة إلى القائمة:

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
    - تُتخطى التعارضات/التكرارات وتُسجل في السجلات

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائياً
    - يمكن لأوامر Plugin/Skills أن تعمل عند كتابتها حتى إذا لم تظهر في قائمة Telegram

    إذا عُطّلت الأوامر الأصلية، تُزال الأوامر المضمنة. وقد تظل أوامر Plugin/المخصصة قابلة للتسجيل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما زالت تتجاوز الحد بعد التشذيب؛ قلل أوامر Plugin/Skills/المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لواجهة Bot API أن `channels.telegram.apiRoot` مضبوط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستطلاع لذلك لا يُبلّغ عن هذا كفشل في تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin ‏`device-pair`)

    عند تثبيت Plugin ‏`device-pair`:

    1. يولّد `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يوجد طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز bootstrap قصير العمر. يحافظ تسليم bootstrap المدمج على رمز العقدة الأساسية عند `scopes: []`؛ ويظل أي رمز مشغل مُسلَّم محدوداً بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق bootstrap مسبوقة بالدور، لذلك لا تلبي قائمة السماح الخاصة بالمشغل سوى طلبات المشغل؛ أما الأدوار غير المشغلة فما زالت تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفاً. شغّل `/pair pending` مجدداً قبل الموافقة.

    مزيد من التفاصيل: [الإقران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمنة">
    هيئ نطاق لوحة المفاتيح المضمنة:

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

    يُطابق `capabilities: ["inlineButtons"]` القديم `inlineButtons: "all"`.

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

    تُمرر نقرات الاستدعاء إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختياري، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختياري، `iconCustomEmojiId`)

    تعرض إجراءات رسائل القنوات أسماء مستعارة مريحة (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر التحكم في البوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (افتراضياً: معطل)

    ملاحظة: `edit` و`topic-create` مفعّلان حالياً افتراضياً ولا يملكان مفاتيح تبديل منفصلة ضمن `channels.telegram.actions.*`.
    تستخدم الإرسالات وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef ارتجالية لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل الردود الصريحة في الناتج المُولَّد:

    - يرد `[[reply_to_current]]` على الرسالة المشغلة
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عند تمكين تسلسل الردود وتوفر نص Telegram الأصلي أو التعليق، يُدرج OpenClaw مقتطف اقتباس أصلياً من Telegram تلقائياً. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من بدايتها وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` تسلسل الردود الضمني. وما زالت وسوم `[[reply_to_*]]` الصريحة تُحترم.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتديات:

    - تلحق مفاتيح جلسة الموضوع `:topic:<threadId>`
    - تستهدف الردود ومؤشر الكتابة سلسلة الموضوع
    - مسار إعداد الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف إرسالات الرسائل `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - ما زالت إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من افتراضيات المجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر تعيين `agentId` في إعداد الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    **ربط موضوع ACP الدائم**: يمكن لمواضيع المنتدى تثبيت جلسات حزام ACP عبر روابط ACP typed علوية المستوى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي يقتصر على مواضيع المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالسلسلة من المحادثة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه المتابعات إليها مباشرة. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعلاً (افتراضياً: `true`).

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل الخاصة التي تحتوي `message_thread_id` بتوجيه الرسائل الخاصة لكنها تستخدم مفاتيح جلسة واعية بالسلسلة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - افتراضياً: سلوك ملف الصوت
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطّر نصوص الملاحظات الصوتية الواردة كنص مولد آلياً وغير موثوق
      في سياق الوكيل؛ وما زال اكتشاف الإشارة يستخدم النص الخام
      لذلك تستمر الرسائل الصوتية المقيدة بالإشارة في العمل.

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

    لا تدعم ملاحظات الفيديو التعليقات؛ ويُرسل نص الرسالة المقدم بشكل منفصل.

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

    ملف ذاكرة الملصقات المؤقتة:

    - `~/.openclaw/telegram/sticker-cache.json`

    تُوصف الملصقات مرة واحدة (عند الإمكان) وتُخزن مؤقتاً لتقليل استدعاءات الرؤية المتكررة.

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

    البحث في الملصقات المخزنة مؤقتاً:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="إشعارات التفاعل">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التفعيل، يضع OpenClaw أحداث النظام في قائمة الانتظار مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (افتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (افتراضي: `minimal`)

    ملاحظات:

    - `own` يعني تفاعلات المستخدمين مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة تخزين مؤقت للرسائل المرسلة).
    - لا تزال أحداث التفاعل تراعي عناصر التحكم في وصول Telegram (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ يتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرفات السلاسل في تحديثات التفاعل.
      - توجه المجموعات غير المنتدى إلى جلسة دردشة المجموعة
      - توجه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/الـ webhook قيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - رجوع إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية Unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    تكون كتابات إعدادات القناة مفعلة افتراضيًا (`configWrites !== false`).

    تشمل الكتابات التي يطلقها Telegram:

    - أحداث ترحيل المجموعات (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلب تفعيل الأمر)

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
    الوضع الافتراضي هو الاستقصاء الطويل. لوضع webhook، اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ ويمكن اختياريًا ضبط `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    يرتبط المستمع المحلي بـ `127.0.0.1:8787`. للإدخال العام، ضع وكيلًا عكسيًا أمام المنفذ المحلي أو اضبط `webhookHost: "0.0.0.0"` عمدًا.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل دردشة/كل موضوع التي يستخدمها الاستقصاء الطويل، لذلك لا تؤخر دورات الوكيل البطيئة ACK التسليم من Telegram.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) من حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يضبط، ينطبق افتراضي grammY). تضبط عملاء بوت الاستقصاء الطويل القيم المهيأة التي تقل عن حارس طلب `getUpdates` البالغ 45 ثانية، حتى لا يتم إلغاء الاستقصاءات الخاملة قبل اكتمال نافذة الاستقصاء البالغة 30 ثانية.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لإعادة تشغيل الاستقصاء المتوقف نتيجة إيجابيات كاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله القيمة `0`.
    - يتم حاليًا تمرير سياق الرد/الاقتباس/إعادة التوجيه التكميلي كما تم استلامه.
    - تتحكم قوائم السماح في Telegram أساسًا بمن يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - تنطبق إعدادات `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة إرسال آمن محدود لفشل Telegram قبل الاتصال، لكنه لا يعيد محاولة أغلفة الشبكة الملتبسة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن يكون هدف إرسال CLI معرف دردشة رقميًا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    تستخدم استقصاءات Telegram الأمر `openclaw message poll` وتدعم مواضيع المنتدى:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    علامات الاستقصاء الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لمواضيع المنتدى (أو استخدم هدفًا بصيغة `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب التسليم المثبت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وGIFs الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يعطل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستقصاءات
    - يعطل `channels.telegram.actions.poll=false` إنشاء استقصاءات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرفات مستخدم Telegram رقمية.

    مسار الإعدادات:

    - `channels.telegram.execApprovals.enabled` (يتفعل تلقائيًا عندما يكون هناك موافق واحد على الأقل قابل للحل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (افتراضي) | `channel` | `both`
    - `agentFilter`، `sessionFilter`

    تتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` بمن يمكنه التحدث إلى البوت وأين يرسل الردود العادية. إنها لا تجعل شخصًا ما موافقًا على التنفيذ. يهيئ أول اقتران رسائل مباشرة معتمد `commands.ownerAllowFrom` عندما لا يكون هناك مالك أوامر بعد، لذلك يستمر إعداد المالك الواحد في العمل بدون تكرار المعرفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في الدردشة؛ فعّل `channel` أو `both` فقط في المجموعات/المواضيع الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحتفظ OpenClaw بالموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بسطح الهدف (`dm` أو `group` أو `all`). تحل معرفات الموافقة ذات البادئة `plugin:` عبر موافقات plugin؛ وتحل الأخرى عبر موافقات التنفيذ أولًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو الموفر، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعدادات في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                          |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى الدردشة. يكتم `silent` ردود الأخطاء بالكامل.                  |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع إغراق الأخطاء أثناء الانقطاعات. |

يتم دعم التجاوزات لكل حساب ولكل مجموعة ولكل موضوع (بالوراثة نفسها كمفاتيح إعدادات Telegram الأخرى).

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
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت من المجموعة وأعد إضافته
    - يحذر `openclaw channels status` عندما تتوقع الإعدادات رسائل مجموعة غير مذكور فيها البوت.
    - يمكن لـ `openclaw channels status --probe` التحقق من معرفات المجموعات الرقمية الصريحة؛ لا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - عند وجود `channels.telegram.groups`، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - صرّح هوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - لا يزال تفويض الأوامر ينطبق حتى عندما تكون سياسة المجموعة `open`
    - يعني فشل `setMyCommands` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدًا؛ قلل أوامر plugin/skill/المخصصة أو عطّل القوائم الأصلية
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` محدودة وتعيد المحاولة مرة واحدة عبر رجوع نقل Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادةً إلى مشكلات قابلية الوصول DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز البوت المهيأ.
    - أعد نسخ رمز البوت أو أنشئه من جديد في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - يعد `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل فشل مصادقة أيضًا؛ التعامل معه على أنه "لا يوجد webhook" لن يؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API لاحقة.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، يتحقق OpenClaw من `getWebhookInfo`؛ عندما يبلغ Telegram عن عنوان URL فارغ للـ webhook، يستمر الاستقصاء لأن التنظيف مستوفى بالفعل.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + جلب/وكيل مخصصان قد يؤديان إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - قد تحل بعض الاستضافات `api.telegram.org` إلى IPv6 أولًا؛ وقد يسبب خروج IPv6 المعطل إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للتعافي.
    - إذا كانت مقابس Telegram يعاد تدويرها وفق إيقاع ثابت قصير، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ يحد عملاء البوت الذين يستخدمون الاستقصاء الطويل القيم المضبوطة أدنى من حارس طلب `getUpdates`، لكن الإصدارات الأقدم قد كانت تجهض كل استقصاء عندما تُضبط هذه القيمة دون مهلة الاستقصاء الطويل.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء ناقل Telegram بعد 120 ثانية دون اكتمال حيوية الاستقصاء الطويل افتراضيًا.
    - يحذر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لناقل الاستقصاء قديمًا.
    - لا تزد `channels.telegram.pollingStallThresholdMs` إلا عندما تكون استدعاءات `getUpdates` الطويلة سليمة لكن مضيفك ما زال يبلغ عن عمليات إعادة تشغيل زائفة بسبب توقف الاستقصاء. عادة ما تشير التوقفات المستمرة إلى مشكلات وكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يلتزم Telegram أيضًا ببيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` ومتغيراتها بالأحرف الصغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان وكيل OpenClaw المُدار مضبوطًا عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد بيئة وكيل قياسية، يستخدم Telegram ذلك العنوان لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج/TLS مباشر غير مستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يعتمد Node 22+ افتراضيًا على `autoSelectFamily=true` (باستثناء WSL2). يلتزم ترتيب نتائج DNS في Telegram بـ`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراضي العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحةً بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق معيار RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيًا. إذا أعاد وكيل fake-IP موثوق أو
      وكيل شفاف كتابة `api.telegram.org` إلى عنوان خاص/داخلي/ذي استخدام خاص آخر
      أثناء تنزيلات الوسائط، يمكنك الاشتراك في تجاوز Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان وكيلك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولًا. تسمح وسائط Telegram بالفعل بنطاق معيار
      RFC 2544 افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حمايات
      SSRF لوسائط Telegram. استخدمه فقط لبيئات الوكيل الموثوقة التي يتحكم بها
      المشغل، مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تنشئ
      إجابات خاصة أو ذات استخدام خاص خارج نطاق معيار RFC 2544. اتركه معطلًا
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

مزيد من المساعدة: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

## مرجع التهيئة

المرجع الأساسي: [مرجع التهيئة - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` بالمستوى الأعلى (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`، `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- الترابط/الردود: `replyToMode`
- التدفق: `streaming` (معاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- جذر API المخصص: `apiRoot` (جذر Bot API فقط؛ لا تُضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند ضبط معرفي حسابات أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يعود OpenClaw إلى أول معرف حساب مطبّع ويحذر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    أقرن مستخدم Telegram مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك قوائم السماح للمجموعات والموضوعات.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="توجيه الوكلاء المتعددين" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
