---
read_when:
    - العمل على ميزات Telegram أو عمليات Webhook
summary: حالة دعم بوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:24:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل الروبوت المباشرة والمجموعات عبر grammY. الاقتراع الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    السياسة الافتراضية للرسائل المباشرة في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف مشكلات القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات وخطط إصلاح عبر القنوات.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القنوات الكاملة.
  </Card>
</CardGroup>

## إعداد سريع

<Steps>
  <Step title="إنشاء رمز الروبوت في BotFather">
    افتح Telegram ودردش مع **@BotFather** (تأكّد أن المعرّف هو بالضبط `@BotFather`).

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

    بديل البيئة: `TELEGRAM_BOT_TOKEN=...` (الحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز في الإعدادات/البيئة، ثم ابدأ Gateway.

  </Step>

  <Step title="بدء Gateway والموافقة على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="إضافة الروبوت إلى مجموعة">
    أضف الروبوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يطابق نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حل الرمز واعٍ بالحساب. عمليًا، تتقدم قيم الإعدادات على بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وإظهار المجموعة">
    تستخدم روبوتات Telegram افتراضيًا **Privacy Mode**، وهو يحدّ مما تتلقاه من رسائل المجموعات.

    إذا كان يجب أن يرى الروبوت كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل الروبوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزِل الروبوت ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف في إعدادات مجموعة Telegram.

    تتلقى روبوتات المشرفين كل رسائل المجموعة، وهذا مفيد لسلوك المجموعة الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح تبديل BotFather مفيدة">

    - `/setjoingroups` للسماح/رفض الإضافات إلى المجموعات
    - `/setprivacy` لسلوك إظهار المجموعة

  </Accordion>
</AccordionGroup>

## التحكم بالوصول والتنشيط

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول عبر الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد أو يخمّن اسم مستخدم الروبوت أن يصدر أوامر إلى الروبوت. استخدمه فقط للروبوتات العامة عمدًا ذات الأدوات المقيدة بإحكام؛ يجب أن تستخدم روبوتات المالك الواحد `allowlist` مع معرّفات المستخدمين الرقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئتان `telegram:` / `tg:` وتُطبّعان.
    في إعدادات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` العلوي المقيّد كحد أمان: إدخالات `allowFrom: ["*"]` على مستوى الحساب لا تجعل ذلك الحساب عامًا إلا إذا كانت قائمة السماح الفعالة للحساب لا تزال تحتوي على بدل صريح بعد الدمج.
    يؤدي `dmPolicy: "allowlist"` مع `allowFrom` فارغ إلى حظر كل الرسائل المباشرة وترفضه عملية التحقق من الإعدادات.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا رقّيت وكانت إعداداتك تحتوي على إدخالات قائمة سماح بصيغة `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز روبوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قوائم السماح في مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في مسارات قوائم السماح (على سبيل المثال عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    بالنسبة لروبوتات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` الرقمية الصريحة لإبقاء سياسة الوصول ثابتة في الإعدادات (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    لبس شائع: لا تعني الموافقة على اقتران الرسائل المباشرة أن "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران وصولًا للرسائل المباشرة. إذا لم يوجد مالك أوامر بعد، فإن أول اقتران موافَق عليه يضبط أيضًا `commands.ownerAllowFrom` بحيث يكون للأوامر الخاصة بالمالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تفويض مرسلي المجموعات يأتي من قوائم السماح الصريحة في الإعدادات.
    إذا أردت "أنا مخوّل مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي في `channels.telegram.allowFrom`؛ وبالنسبة للأوامر الخاصة بالمالك فقط، تأكّد أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (من دون روبوت تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى روبوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة جهة خارجية (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    ينطبق عنصران للتحكم معًا:

    1. **أي المجموعات مسموح بها** (`channels.telegram.groups`)
       - لا يوجد إعداد `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم إعداد `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح بهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئتان `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة تحت `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسلين.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسلي المجموعة موافقات مخزن اقتران الرسائل المباشرة.
    يبقى الاقتران للرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في الإعدادات، لا إلى مخزن الاقتران.
    نمط عملي لروبوتات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، تفشل افتراضات وقت التشغيل بإغلاق `groupPolicy="allowlist"` إلا إذا ضُبط `channels.defaults.groupPolicy` صراحةً.

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
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تحديد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل الروبوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى الروبوت.

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

    هذه تحدّث حالة الجلسة فقط. استخدم الإعدادات للاستمرارية.

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

    - أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص `getUpdates` في Bot API

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يملك عملية Gateway قناة Telegram.
- التوجيه حتمي: ترد رسائل Telegram الواردة إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى غلاف القناة المشترك مع بيانات وصفية للرد، وعناصر نائبة للوسائط، وسياق سلسلة ردود مستمر لردود Telegram التي رصدها Gateway.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف مواضيع المنتدى `:topic:<threadId>` لإبقاء المواضيع معزولة.
- يمكن أن تحمل رسائل الرسائل المباشرة `message_thread_id`؛ يحافظ OpenClaw على معرّف السلسلة للردود لكنه يُبقي الرسائل المباشرة على الجلسة المسطحة افتراضيًا. اضبط `channels.telegram.dm.threadReplies: "inbound"` أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"` أو `requireTopic: true` أو إعداد موضوع مطابقًا عندما تريد عمدًا عزل جلسات مواضيع الرسائل المباشرة.
- يستخدم الاقتراع الطويل مشغّل grammY مع تسلسل لكل دردشة/سلسلة. يستخدم توازي مصرف المشغّل العام `agents.defaults.maxConcurrent`.
- الاقتراع الطويل محمي داخل كل عملية Gateway بحيث لا يمكن إلا لمستطلع نشط واحد استخدام رمز روبوت في الوقت نفسه. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستطلعًا خارجيًا يستخدم الرمز نفسه.
- تبدأ عمليات إعادة تشغيل مراقب الاقتراع الطويل افتراضيًا بعد 120 ثانية من دون حيوية `getUpdates` مكتملة. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك لا يزال يرى عمليات إعادة تشغيل كاذبة بسبب توقف الاقتراع أثناء عمل طويل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يُبقي `progress` مسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويمحوها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المحررة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأوامر/التنفيذ داخل أسطر تقدم الأدوات تلك: `raw` (الافتراضي، يحافظ على السلوك المنشور) أو `status` (تسمية الأداة فقط)
    - تُكتشف قيم `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر أو قراءات الملفات أو تحديثات التخطيط أو ملخصات التصحيحات. يبقيها Telegram مفعّلة افتراضيًا لمطابقة سلوك OpenClaw المنشور من `v2026.4.22` وما بعده. لإبقاء المعاينة المحررة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

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

    للإبقاء على تقدّم الأدوات مرئيًا مع إخفاء نص الأمر/التنفيذ، عيّن:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    استخدم وضع `progress` عندما تريد تقدّم أدوات مرئيًا من دون تحرير الإجابة النهائية داخل الرسالة نفسها. ضع سياسة نص الأمر تحت `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: يتم تعطيل تعديلات معاينة Telegram، ويتم كبت ثرثرة الأدوات/التقدّم العامة بدل إرسالها كرسائل حالة مستقلة. تظل مطالبات الموافقة، وحمولات الوسائط، والأخطاء تمر عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط الإبقاء على تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدّم الأدوات.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تحرير معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` إظهار أسطر الحالة القصيرة لذلك الدور. تظل ردود الرسالة الحالية من دون نص اقتباس محدد تحتفظ ببث المعاينة. عيّن `replyToMode: "off"` عندما تكون رؤية تقدّم الأدوات أهم من ردود الاقتباس الأصلية، أو عيّن `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات الرسائل المباشرة/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري التحرير النهائي في مكانه
    - النصوص النهائية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الموجودة كأول جزء نهائي عند الإمكان، ثم ترسل الأجزاء المتبقية فقط
    - تنظف النهائيات في وضع التقدّم مسودة الحالة وتستخدم التسليم النهائي العادي بدل تحرير المسودة لتصبح الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يتم تمكين بث الكتل صراحةً لـ Telegram، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة الحية أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما يجب أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر `parse_mode: "HTML"` في Telegram.

    - يتم تصيير النص الشبيه بـ Markdown إلى HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام من النموذج لتقليل حالات فشل التحليل في Telegram.
    - إذا رفض Telegram HTML المحلل، يعيد OpenClaw المحاولة كنص عادي.

    يتم تمكين معاينات الروابط افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    افتراضيات الأوامر الأصلية:

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

    - تتم تسوية الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، بطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ فهي لا تنفذ السلوك تلقائيًا
    - يمكن أن تظل أوامر Plugin/Skills تعمل عند كتابتها حتى إن لم تظهر في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، تتم إزالة الأوامر المدمجة. قد تظل أوامر Plugin/المخصصة تسجل إذا تم تكوينها.

    إخفاقات الإعداد الشائعة:

    - تعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما زالت تتجاوز الحد بعد التشذيب؛ قلل أوامر Plugin/Skills/المخصصة أو عطّل `channels.telegram.commands.native`.
    - يمكن أن يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لواجهة Bot API أن `channels.telegram.apiRoot` تم ضبطه على نقطة نهاية `/bot<TOKEN>` الكاملة. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` العرضية.
    - تعني `getMe returned 401` أن Telegram رفض رمز البوت المكوّن. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء، لذلك لا يتم الإبلاغ عن ذلك كفشل في تنظيف Webhook.
    - تعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin `device-pair`)

    عندما يكون Plugin `device-pair` مثبتًا:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. يحافظ تسليم التمهيد المدمج على رمز العقدة الأساسية عند `scopes: []`؛ ويبقى أي رمز مشغل يتم تسليمه محدودًا إلى `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق التمهيد مسبوقة بالدور، لذلك تلبي قائمة السماح الخاصة بالمشغل طلبات المشغل فقط؛ أما الأدوار غير المشغلة فما زالت تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يتم استبدال الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

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

    يتم ربط `capabilities: ["inlineButtons"]` القديم بـ `inlineButtons: "all"`.

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

    تُمرر نقرات رد الاتصال إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أدوات Telegram:

    - `sendMessage` (`to`، `content`، اختياري `mediaUrl`، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، اختياري `iconColor`، `iconCustomEmojiId`)

    تكشف إجراءات رسائل القناة أسماء مستعارة مريحة (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر التحكم في البوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (افتراضي: معطل)

    ملاحظة: يتم حاليًا تمكين `edit` و`topic-create` افتراضيًا ولا توجد لهما مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم الإرسالات في وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تجري مسارات الإجراءات إعادة حل مخصصة لـ SecretRef لكل إرسال.

    دلالات إزالة التفاعلات: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل ردود صريحة في الإخراج المولّد:

    - يرد `[[reply_to_current]]` على الرسالة المشغلة
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عندما يتم تمكين تسلسل الردود ويكون نص Telegram الأصلي أو التعليق متاحًا، يضمن OpenClaw مقتطف اقتباس Telegram أصليًا تلقائيًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك يتم اقتباس الرسائل الأطول من البداية والرجوع إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطل `off` تسلسل الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتدى:

    - تضيف مفاتيح جلسات المواضيع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة الموضوع
    - مسار تكوين الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف إرسالات الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - تظل إجراءات الكتابة تتضمن `message_thread_id`

    توريث الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من افتراضيات المجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر تعيين `agentId` في تكوين الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    **ربط موضوع ACP المستمر**: يمكن لمواضيع المنتدى تثبيت جلسات عُدّة ACP عبر روابط ACP المكتوبة ذات المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي مقتصر على مواضيع المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجّه المتابعات إليها مباشرة. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` ممكّنًا (افتراضي: `true`).

    يكشف سياق القالب `MessageThreadId` و`IsForum`. تحافظ محادثات الرسائل المباشرة التي تحتوي على `message_thread_id` على توجيه الرسائل المباشرة وبيانات الرد الوصفية في الجلسات المسطحة افتراضيا؛ ولا تستخدم مفاتيح جلسات واعية بالسلاسل إلا عند تهيئتها باستخدام `threadReplies: "inbound"`، أو `threadReplies: "always"`، أو `requireTopic: true`، أو تهيئة موضوع مطابقة. استخدم `channels.telegram.dm.threadReplies` في المستوى الأعلى ليكون الإعداد الافتراضي للحساب، أو `direct.<chatId>.threadReplies` لرسالة مباشرة واحدة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف الصوت
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُعرض تفريغات الملاحظات الصوتية الواردة كنص مولد آليا وغير موثوق
      في سياق الوكيل؛ ولا يزال اكتشاف الإشارة يستخدم التفريغ الخام
      حتى تظل الرسائل الصوتية المقيدة بالإشارة تعمل.

    مثال إجراء الرسالة:

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

    مثال إجراء الرسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    لا تدعم ملاحظات الفيديو التعليقات التوضيحية؛ يُرسل نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزل ويُعالج (العنصر النائب `<media:sticker>`)
    - TGS متحرك: يتم تخطيه
    - WEBM فيديو: يتم تخطيه

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة تخزين الملصقات المؤقتة:

    - `~/.openclaw/telegram/sticker-cache.json`

    توصف الملصقات مرة واحدة (عند الإمكان) وتخزن مؤقتا لتقليل استدعاءات الرؤية المتكررة.

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

  <Accordion title="إشعارات التفاعل">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند تفعيلها، يضع OpenClaw أحداث نظام في قائمة الانتظار مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    التهيئة:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - يعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة تخزين الرسائل المرسلة المؤقتة).
    - لا تزال أحداث التفاعل تحترم عناصر التحكم في الوصول الخاصة بـ Telegram (`dmPolicy`، و`allowFrom`، و`groupPolicy`، و`groupAllowFrom`)؛ ويتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرفات السلاسل في تحديثات التفاعل.
      - تُوجه المجموعات غير المنتديات إلى جلسة محادثة المجموعة
      - تُوجه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` للاستطلاع/Webhook قيمة `message_reaction` تلقائيا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزا تعبيريا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع الاحتياطي إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رمزا تعبيريا بترميز unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات التهيئة من أحداث وأوامر Telegram">
    تكون كتابات تهيئة القناة مفعلة افتراضيا (`configWrites !== false`).

    تشمل الكتابات المشغلة من Telegram ما يلي:

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

  <Accordion title="الاستطلاع الطويل مقابل Webhook">
    الافتراضي هو الاستطلاع الطويل. لوضع Webhook، عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ اختياريا `webhookPath`، و`webhookHost`، و`webhookPort` (القيم الافتراضية `/telegram-webhook`، و`127.0.0.1`، و`8787`).

    في وضع الاستطلاع الطويل، يستمر OpenClaw في حفظ علامة إعادة التشغيل المائية الخاصة به فقط بعد إرسال التحديث بنجاح. إذا فشل معالج، يبقى ذلك التحديث قابلا لإعادة المحاولة في العملية نفسها ولا يُكتب كمكتمل لإزالة التكرار عند إعادة التشغيل.

    يرتبط المستمع المحلي بـ `127.0.0.1:8787`. بالنسبة للدخول العام، إما أن تضع وكيلا عكسيا أمام المنفذ المحلي أو تعيّن `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل محادثة/لكل موضوع المستخدمة في الاستطلاع الطويل، لذلك لا تعطل دورات الوكيل البطيئة ACK تسليم Telegram.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) من حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِده إذا وصلت أجزاء الألبوم متأخرة؛ وقلله لتقليل زمن انتظار الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم تُعيّن، تُطبق القيمة الافتراضية لـ grammY). تقيد عملاء البوت القيم المهيأة الأدنى من حارس طلبات النص/الكتابة الصادرة البالغ 60 ثانية حتى لا يلغي grammY تسليم الرد المرئي قبل أن يتمكن حارس نقل OpenClaw والرجوع الاحتياطي من العمل. لا يزال الاستطلاع الطويل يستخدم حارس طلب `getUpdates` مدته 45 ثانية حتى لا تُترك الاستطلاعات الخاملة إلى أجل غير مسمى.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاستطلاع الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتؤدي `0` إلى تعطيله.
    - يُطبع سياق الرد/الاقتباس/إعادة التوجيه التكميلي في نافذة سياق محادثة محددة واحدة عندما يكون Gateway قد لاحظ الرسائل الأصلية؛ وتستمر ذاكرة تخزين الرسائل المرصودة المؤقتة بجانب مخزن الجلسات. لا يتضمن Telegram إلا `reply_to_message` ضحلا واحدا في التحديثات، لذا تقتصر السلاسل الأقدم من ذاكرة التخزين المؤقت على حمولة تحديث Telegram الحالية.
    - تتحكم قوائم السماح في Telegram أساسا في من يمكنه تشغيل الوكيل، وليست حدا كاملا لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - تنطبق تهيئة `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضا إعادة محاولة إرسال آمنة ومحدودة لإخفاقات Telegram قبل الاتصال، لكنه لا يعيد محاولة أغلفة الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال عبر CLI وأداة الرسائل معرف محادثة رقميا، أو اسم مستخدم، أو هدف موضوع منتدى:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    تستخدم استطلاعات Telegram الأمر `openclaw message poll` وتدعم مواضيع المنتديات:

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

    يدعم إرسال Telegram أيضا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب التسليم المثبت عندما يستطيع البوت التثبيت في تلك المحادثة
    - `--force-document` لإرسال الصور وGIF الصادرة كمستندات بدلا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يعطل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يعطل `channels.telegram.actions.poll=false` إنشاء استطلاعات Telegram مع إبقاء الإرسالات العادية مفعلة

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريا نشر المطالبات في المحادثة أو الموضوع الأصلي. يجب أن يكون الموافقون معرفات مستخدمي Telegram رقمية.

    مسار التهيئة:

    - `channels.telegram.execApprovals.enabled` (يتفعل تلقائيا عندما يكون هناك موافق واحد على الأقل قابلا للحل)
    - `channels.telegram.execApprovals.approvers` (يرجع احتياطيا إلى معرفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`، و`sessionFilter`

    تتحكم `channels.telegram.allowFrom`، و`groupAllowFrom`، و`defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. وهي لا تجعل شخصا ما موافقا على التنفيذ. يمهد أول اقتران رسائل مباشرة معتمد `commands.ownerAllowFrom` عندما لا يكون هناك مالك أوامر بعد، لذلك يظل إعداد المالك الواحد يعمل من دون تكرار المعرفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في المحادثة؛ لا تفعل `channel` أو `both` إلا في المجموعات/المواضيع الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيا.

    تتطلب أزرار الموافقة المضمنة أيضا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm`، أو `group`، أو `all`). تُحل معرفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ وتُحل المعرفات الأخرى عبر موافقات التنفيذ أولا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو في الموفر، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا تهيئة في هذا السلوك:

| المفتاح                              | القيم             | الافتراضي | الوصف                                                                                                   |
| ----------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى المحادثة. يكتم `silent` ردود الأخطاء بالكامل.                         |
| `channels.telegram.errorCooldownMs` | عدد (ms)          | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى المحادثة نفسها. يمنع رسائل الأخطاء المتكررة أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بالتوريث نفسه مثل مفاتيح تهيئة Telegram الأخرى).

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
  <Accordion title="لا يستجيب البوت لرسائل المجموعات التي لا تتضمن إشارة إليه">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت من المجموعة وأعد إضافته إليها
    - يحذّر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعات بلا إشارة.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="لا يرى البوت رسائل المجموعة إطلاقًا">

    - عند وجود `channels.telegram.groups`، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="تعمل الأوامر جزئيًا أو لا تعمل إطلاقًا">

    - صرّح هوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - لا يزال تفويض الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدًا؛ قلّل أوامر Plugin/Skill/المخصصة أو عطّل القوائم الأصلية
    - استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة وتُعاد مرة واحدة عبر احتياطي نقل Telegram عند انتهاء مهلة الطلب. عادةً ما تشير أخطاء الشبكة/الجلب المستمرة إلى مشكلات في قابلية الوصول إلى `api.telegram.org` عبر DNS/HTTPS

  </Accordion>

  <Accordion title="يبلغ بدء التشغيل عن رمز مميز غير مصرّح به">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز البوت المكوّن.
    - أعد نسخ رمز البوت أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضًا فشل مصادقة؛ التعامل معه على أنه "لا يوجد Webhook" لن يفعل إلا تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API لاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - قد يؤدي Node 22+ مع جلب/وكيل مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يؤدي تعطل خروج IPv6 إلى إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للتعافي.
    - أثناء بدء تشغيل الاستقصاء، يعيد OpenClaw استخدام فحص `getMe` الناجح عند بدء التشغيل لـ grammY حتى لا يحتاج المشغّل إلى `getMe` ثانٍ قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، يواصل OpenClaw الاستقصاء الطويل بدلًا من إجراء استدعاء تحكم آخر قبل الاستقصاء. يظهر Webhook الذي لا يزال نشطًا كتعارض `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا أُعيد تدوير مقابس Telegram بوتيرة قصيرة ثابتة، فتحقق من قيمة منخفضة لـ `channels.telegram.timeoutSeconds`؛ تقيد عملاء البوت القيم المكوّنة التي تقل عن حراس الطلبات الصادرة و`getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تُجهض كل استقصاء أو رد عند ضبط هذه القيمة دون تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية افتراضيًا دون اكتمال حيوية الاستقصاء الطويل.
    - يحذّر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء جارٍ قد أكمل `getUpdates` بعد سماح بدء التشغيل، أو عندما لا يكون حساب Webhook جارٍ قد أكمل `setWebhook` بعد سماح بدء التشغيل، أو عندما يكون آخر نشاط نقل استقصاء ناجح قديمًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` الطويلة سليمة لكن مضيفك لا يزال يبلّغ خطأً عن عمليات إعادة تشغيل بسبب توقف الاستقصاء. عادةً ما تشير حالات التوقف المستمرة إلى مشكلات وكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يحترم Telegram أيضًا متغيرات بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` ومتغيراتها بالأحرف الصغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان وكيل OpenClaw المُدار مكوّنًا عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد متغيرات بيئة وكيل قياسية، يستخدم Telegram ذلك العنوان لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج مباشر/TLS غير مستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يفترض Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2). يحترم ترتيب نتائج DNS في Telegram `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراضي العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يرجع Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحةً بشكل أفضل بسلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق قياس الأداء RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيًا. إذا أعاد وكيل fake-IP موثوق أو
      وكيل شفاف كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/ذي استخدام خاص أثناء تنزيلات الوسائط، يمكنك الاشتراك
      في التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان وكيلك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة متوقفة أولًا. تسمح وسائط Telegram بالفعل بنطاق
      قياس الأداء RFC 2544 افتراضيًا.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` يضعف حماية SSRF
      لوسائط Telegram. استخدمه فقط لبيئات الوكيل الموثوقة الخاضعة لسيطرة المشغّل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تُنشئ
      إجابات خاصة أو ذات استخدام خاص خارج نطاق قياس الأداء RFC 2544.
      اتركه متوقفًا لوصول Telegram العادي عبر الإنترنت العام.
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

## مرجع الإعداد

المرجع الأساسي: [مرجع الإعداد - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية القيمة">

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` ذات المستوى الأعلى (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`، `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- الخيوط/الردود: `replyToMode`، `dm.threadReplies`، `direct.*.threadReplies`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تُضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تكوين معرّفين أو أكثر للحسابات، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يرجع OpenClaw إلى أول معرّف حساب مُطبّع ويحذّر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
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
    نموذج التهديد والتحصين.
  </Card>
  <Card title="توجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والمواضيع بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
