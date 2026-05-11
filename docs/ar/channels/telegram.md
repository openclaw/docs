---
read_when:
    - العمل على ميزات Telegram أو عمليات Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:22:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل البوت المباشرة والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ وضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية لـ Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف مشكلات القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وأدلة إصلاح تشغيلية.
  </Card>
  <Card title="تكوين Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة تكوين القنوات الكاملة.
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

    الرجوع الاحتياطي عبر البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
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
    أضف البوت إلى مجموعتك، ثم احصل على كلا المعرّفين اللذين يحتاجهما وصول المجموعة:

    - معرّف مستخدم Telegram الخاص بك، والمستخدم في `allowFrom` / `groupAllowFrom`
    - معرّف محادثة مجموعة Telegram، والمستخدم كمفتاح ضمن `channels.telegram.groups`

    للإعداد لأول مرة، احصل على معرّف محادثة المجموعة من `openclaw logs --follow`، أو بوت معرّفات مُعاد توجيهها، أو Bot API `getUpdates`. بعد السماح للمجموعة، يمكن لـ `/whoami@<bot_username>` تأكيد معرّفات المستخدم والمجموعة.

    معرّفات مجموعات Telegram الفائقة السالبة التي تبدأ بـ `-100` هي معرّفات محادثات جماعية. ضعها ضمن `channels.telegram.groups`، وليس ضمن `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتيب حلّ الرمز يراعي الحساب. عمليًا، تتفوق قيم config على الرجوع الاحتياطي عبر البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وظهور المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، والذي يحد من رسائل المجموعة التي تتلقاها.

    إذا كان يجب أن يرى البوت كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مسؤولًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت وأعد إضافته في كل مجموعة كي يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المسؤول في إعدادات مجموعة Telegram.

    تتلقى البوتات المسؤولة كل رسائل المجموعة، وهذا مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك الظهور في المجموعات

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول عبر الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد اسم مستخدم البوت أو يخمنه أن يصدر أوامر للبوت. استخدمه فقط للبوتات العامة عمدًا ذات الأدوات المقيدة بإحكام؛ يجب أن تستخدم البوتات ذات المالك الواحد `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل بادئات `telegram:` / `tg:` وتُطبّع.
    في تكوينات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` التقييدي في المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا ظلت قائمة السماح الفعلية للحساب تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة، ويرفضه تحقق config.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا قمت بالترقية وكان config لديك يحتوي على إدخالات قائمة سماح بصيغة `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة سماح مخزن الاقتران، يمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في مسارات قائمة السماح (على سبيل المثال عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    للبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول دائمة في config (بدلًا من الاعتماد على موافقات اقتران سابقة).

    التباس شائع: الموافقة على اقتران الرسائل المباشرة لا تعني "هذا المرسل مخول في كل مكان".
    يمنح الاقتران وصول الرسائل المباشرة. إذا لم يكن هناك مالك أوامر بعد، فإن أول اقتران مُعتمد يضبط أيضًا `commands.ownerAllowFrom` بحيث تكون لأوامر المالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تفويض مرسلي المجموعات يأتي من قوائم سماح صريحة في config.
    إذا أردت "أنا مخول مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ ولأوامر المالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (بدون بوت تابع لجهة خارجية):

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

    1. **أي المجموعات مسموح بها** (`channels.telegram.groups`)
       - بدون config لـ `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - عند تكوين `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح بهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. إذا لم يُضبط، يرجع Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع بادئات `telegram:` / `tg:`).
    لا تضع معرّفات محادثات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات المحادثات السالبة إلى `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسلي المجموعة موافقات مخزن اقتران الرسائل المباشرة.
    يبقى الاقتران للرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/لكل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يرجع Telegram إلى `allowFrom` في config، وليس إلى مخزن الاقتران.
    النمط العملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، تكون الإعدادات الافتراضية وقت التشغيل مغلقة آمنًا `groupPolicy="allowlist"` ما لم يُضبط `channels.defaults.groupPolicy` صراحةً.

    إعداد مجموعة لمالك فقط:

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

    اختبره من المجموعة باستخدام `@<bot_username> ping`. لا تشغّل رسائل المجموعة العادية البوت عندما يكون `requireMention: true`.

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
    تتطلب ردود المجموعات إشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية `@botusername`، أو
    - أنماط إشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح أوامر على مستوى الجلسة:

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

    الحصول على معرّف محادثة المجموعة:

    - أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص Bot API `getUpdates`
    - بعد السماح للمجموعة، شغّل `/whoami@<bot_username>` إذا كانت الأوامر الأصلية مفعّلة

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يملك Gateway عملية Telegram.
- التوجيه حتمي: ترد مدخلات Telegram الواردة إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى مغلف القناة المشترك مع بيانات تعريف الرد، وعناصر نائبة للوسائط، وسياق سلسلة ردود مستمر لردود Telegram التي رصدها Gateway.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف مواضيع المنتدى `:topic:<threadId>` لإبقاء المواضيع معزولة.
- يمكن أن تحمل رسائل الرسائل المباشرة `message_thread_id`؛ يحافظ OpenClaw على معرّف السلسلة للردود لكنه يبقي الرسائل المباشرة على الجلسة المسطحة افتراضيًا. كوّن `channels.telegram.dm.threadReplies: "inbound"`، أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، أو `requireTopic: true`، أو تكوين موضوع مطابق عندما تريد عمدًا عزل جلسات موضوعات الرسائل المباشرة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل محادثة/لكل سلسلة. يستخدم تزامن مصب المشغّل الكلي `agents.defaults.maxConcurrent`.
- يُحمى الاستقصاء الطويل داخل كل عملية Gateway بحيث لا يمكن إلا لمستطلع نشط واحد استخدام رمز بوت في وقت واحد. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المحتمل أن Gateway آخر من OpenClaw، أو سكربتًا، أو مستطلعًا خارجيًا يستخدم الرمز نفسه.
- تُشغّل عمليات إعادة تشغيل مراقب الاستقصاء الطويل افتراضيًا بعد 120 ثانية دون اكتمال حيوية `getUpdates`. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك لا يزال يرى عمليات إعادة تشغيل كاذبة بسبب توقف الاستقصاء أثناء عمل طويل الأمد. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث ردود جزئية في الوقت الفعلي:

    - المحادثات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هي `off | partial | block | progress` (الافتراضي: `partial`)
    - يحافظ `progress` على مسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويمحوها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المحررة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل أسطر تقدم الأدوات تلك: `raw` (الافتراضي، يحافظ على السلوك الصادر) أو `status` (تسمية الأداة فقط)
    - يتم اكتشاف قيم `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءات الملفات، وتحديثات التخطيط، أو ملخصات التصحيحات. يبقي Telegram هذه مفعلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده. للاحتفاظ بالمعاينة المحررة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

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

    للاحتفاظ بتقدم الأدوات مرئيًا مع إخفاء نص الأمر/التنفيذ، اضبط:

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

    استخدم وضع `progress` عندما تريد تقدم أدوات مرئيًا من دون تحرير الإجابة النهائية داخل الرسالة نفسها. ضع سياسة نص الأمر تحت `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: يتم تعطيل تعديلات معاينة Telegram ويتم كتم دردشة الأدوات/التقدم العامة بدلًا من إرسالها كرسائل حالة مستقلة. لا تزال مطالبات الموافقة، وحمولات الوسائط، والأخطاء تمر عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط الإبقاء على تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تحرير معاينة الإجابة، لذلك لا يمكن لـ `streaming.preview.toolProgress` إظهار أسطر الحالة القصيرة لذلك الدور. لا تزال ردود الرسالة الحالية من دون نص اقتباس محدد تحتفظ ببث المعاينة. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأدوات أهم من ردود الاقتباس الأصلية، أو اضبط `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات الرسائل المباشرة/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها وينفذ التحرير النهائي في مكانه
    - النصوص النهائية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الحالية كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - تمحو النهايات في وضع التقدم مسودة الحالة وتستخدم التسليم النهائي العادي بدلًا من تحرير المسودة لتصبح الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يتم تفعيل بث الكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة الحية أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما يجب أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع إلى HTML">
    يستخدم النص الصادر `parse_mode: "HTML"` في Telegram.

    - يتم عرض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - يتم إفلات HTML الخام من النموذج لتقليل إخفاقات تحليل Telegram.
    - إذا رفض Telegram‏ HTML المحلل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

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
    - النمط الصالح: `a-z`، و`0-9`، و`_`، بطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - لا يزال بإمكان أوامر Plugin/Skills العمل عند كتابتها حتى إذا لم تظهر في قائمة Telegram

    إذا عُطلت الأوامر الأصلية، تتم إزالة المضمنة. قد تستمر أوامر مخصصة/Plugin في التسجيل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال قد تجاوزت الحد بعد التشذيب؛ قلل أوامر Plugin/Skills/المخصصة أو عطّل `channels.telegram.commands.native`.
    - يمكن أن يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر Bot API المباشرة عبر curl أن `channels.telegram.apiRoot` تم ضبطه على نقطة نهاية `/bot<TOKEN>` الكاملة. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستطلاع، لذلك لا يتم الإبلاغ عن هذا كفشل في تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin ‏`device-pair`)

    عند تثبيت Plugin ‏`device-pair`:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. يحافظ تسليم التمهيد المضمن على رمز العقدة الأساسي عند `scopes: []`؛ ويبقى أي رمز مشغّل تم تسليمه محدودًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق التمهيد مسبوقة بالدور، لذلك تفي قائمة السماح الخاصة بالمشغّل هذه بطلبات المشغّل فقط؛ ولا تزال الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة مع تفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يتم استبدال الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

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
    - `allowlist` (الافتراضي)

    يتم تحويل `capabilities: ["inlineButtons"]` القديم إلى `inlineButtons: "all"`.

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

    يتم تمرير نقرات رد الاتصال إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أدوات Telegram:

    - `sendMessage` (`to`، و`content`، و`mediaUrl` اختياري، و`replyToMessageId`، و`messageThreadId`)
    - `react` (`chatId`، و`messageId`، و`emoji`)
    - `deleteMessage` (`chatId`، و`messageId`)
    - `editMessage` (`chatId`، و`messageId`، و`content`)
    - `createForumTopic` (`chatId`، و`name`، و`iconColor` اختياري، و`iconCustomEmojiId`)

    تعرض إجراءات رسائل القنوات أسماء بديلة مريحة (`send`، و`react`، و`delete`، و`edit`، و`sticker`، و`sticker-search`، و`topic-create`).

    عناصر التحكم في الحجب:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: `edit` و`topic-create` مفعلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات إرسال وقت التشغيل لقطة التهيئة/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل ردود صريحة في المخرجات المولدة:

    - يرد `[[reply_to_current]]` على الرسالة المشغّلة
    - يرد `[[reply_to:<id>]]` على معرف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    عندما يكون تسلسل الردود مفعلًا ويتوفر نص Telegram الأصلي أو التعليق، يضمن OpenClaw مقتطف اقتباس أصليًا من Telegram تلقائيًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك يتم اقتباس الرسائل الأطول من البداية والرجوع إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطل `off` تسلسل الردود الضمني. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك سلاسل المحادثات">
    المجموعات الفائقة للمنتديات:

    - تضيف مفاتيح جلسات المواضيع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة موضوع النقاش
    - مسار تهيئة الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات المواضيع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`، و`allowFrom`، و`skills`، و`systemPrompt`، و`enabled`، و`groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من افتراضيات المجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف من خلال ضبط `agentId` في تهيئة الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    **ربط موضوع ACP دائم**: يمكن لموضوعات المنتديات تثبيت جلسات مشغّل ACP عبر روابط ACP typed من المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"`، ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي يقتصر على موضوعات المنتديات في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلاً (الافتراضي: `true`).

    يعرّض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ دردشات الرسائل المباشرة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة وبيانات الرد الوصفية على الجلسات المسطحة افتراضياً؛ ولا تستخدم مفاتيح جلسات مدركة للسلاسل إلا عند تكوينها باستخدام `threadReplies: "inbound"` أو `threadReplies: "always"` أو `requireTopic: true` أو تكوين موضوع مطابق. استخدم `channels.telegram.dm.threadReplies` من المستوى الأعلى لافتراضي الحساب، أو `direct.<chatId>.threadReplies` لرسالة مباشرة واحدة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف الصوت
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُعرض نصوص الملاحظات الصوتية الواردة كنص مولّد آلياً
      وغير موثوق في سياق الوكيل؛ وما يزال اكتشاف الإشارات يستخدم النص الخام
      حتى تظل الرسائل الصوتية المشروطة بالإشارة تعمل.

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ يُرسل نص الرسالة المقدم بشكل منفصل.

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

    ملف ذاكرة تخزين الملصقات المؤقتة:

    - `~/.openclaw/telegram/sticker-cache.json`

    توصف الملصقات مرة واحدة (عند الإمكان) وتُخزّن مؤقتاً لتقليل استدعاءات الرؤية المتكررة.

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

    عند التفعيل، يضع OpenClaw أحداث نظامية في الطابور مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    التكوين:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - يعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة تخزين الرسائل المرسلة المؤقتة).
    - ما تزال أحداث التفاعل تحترم ضوابط وصول Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ يُسقط المرسلون غير المصرح لهم.
    - لا يوفر Telegram معرّفات السلاسل في تحديثات التفاعل.
      - تُوجّه المجموعات غير المنتديات إلى جلسة دردشة المجموعة
      - تُوجّه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، لا إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` للاستطلاع/Webhook `message_reaction` تلقائياً.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزاً تعبيرياً للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزاً تعبيرية Unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات التكوين من أحداث وأوامر Telegram">
    تكون كتابات تكوين القناة مفعّلة افتراضياً (`configWrites !== false`).

    تشمل الكتابات المشغلة من Telegram:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلب تفعيل الأمر)

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

  <Accordion title="الاستطلاع الطويل مقابل Webhook">
    الافتراضي هو الاستطلاع الطويل. لوضع Webhook عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ والخيارات الاختيارية `webhookPath` و`webhookHost` و`webhookPort` (الافتراضيات `/telegram-webhook` و`127.0.0.1` و`8787`).

    في وضع الاستطلاع الطويل، يحتفظ OpenClaw بعلامة مائية لإعادة التشغيل فقط بعد إرسال تحديث بنجاح. إذا فشل معالج، يبقى ذلك التحديث قابلاً لإعادة المحاولة في العملية نفسها ولا يُكتب كمكتمل لإزالة تكرار إعادة التشغيل.

    يستمع المستمع المحلي على `127.0.0.1:8787`. وللدخول العام، ضع وكيلاً عكسياً أمام المنفذ المحلي أو عيّن `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل دردشة/كل موضوع المستخدمة في الاستطلاع الطويل، لذلك لا تُبقي جولات الوكيل البطيئة ACK تسليم Telegram معلّقاً.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتاً قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِدها إذا وصلت أجزاء الألبوم متأخرة؛ قللها لتخفيض زمن استجابة الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُعيّن، فتنطبق قيمة grammY الافتراضية). يقيّد عملاء البوت القيم المكوّنة التي تقل عن حارس طلب النص/الكتابة الصادر ذي 60 ثانية حتى لا يوقف grammY تسليم الرد المرئي قبل تشغيل حارس نقل OpenClaw والبديل. ما يزال الاستطلاع الطويل يستخدم حارس طلب `getUpdates` لمدة 45 ثانية حتى لا تُترك الاستطلاعات الخاملة إلى أجل غير مسمى.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لعمليات إعادة تشغيل توقف الاستطلاع ذات النتائج الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله القيمة `0`.
    - يُطبّع سياق الرد/الاقتباس/إعادة التوجيه التكميلي في نافذة سياق محادثة مختارة واحدة عندما يكون Gateway قد رصد الرسائل الأصلية؛ وتُحفظ ذاكرة تخزين الرسائل المرصودة المؤقتة بجانب مخزن الجلسات. لا يدرج Telegram إلا `reply_to_message` سطحياً واحداً في التحديثات، لذلك تقتصر السلاسل الأقدم من ذاكرة التخزين المؤقتة على حمولة التحديث الحالية في Telegram.
    - تتحكم قوائم سماح Telegram أساساً في من يمكنه تشغيل الوكيل، وليست حد تنقيح كامل للسياق التكميلي.
    - ضوابط سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق تكوين `channels.telegram.retry` على مساعدين إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضاً إعادة محاولة إرسال آمنة محدودة لفشل ما قبل اتصال Telegram، لكنه لا يعيد محاولة أغلفة الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف إرسال CLI وأداة الرسائل معرّف دردشة رقمياً، أو اسم مستخدم، أو هدف موضوع منتدى:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    تستخدم استطلاعات Telegram الأمر `openclaw message poll` وتدعم موضوعات المنتديات:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    علامات الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتديات (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضاً:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور الصادرة وGIFs ومقاطع الفيديو كمستندات بدلاً من رفعها كصور مضغوطة أو وسائط متحركة أو فيديو

    تقييد الإجراءات:

    - يعطل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يعطل `channels.telegram.actions.poll=false` إنشاء استطلاعات Telegram مع إبقاء الإرسالات العادية مفعّلة

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في رسائل الموافقين المباشرة ويمكنه اختيارياً نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار التكوين:

    - `channels.telegram.execApprovals.enabled` (يتفعل تلقائياً عندما يمكن حل موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالكين الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter` و`sessionFilter`

    تتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. لكنها لا تجعل شخصاً ما موافق تنفيذ. تؤسس أول عملية اقتران رسالة مباشرة معتمدة `commands.ownerAllowFrom` عندما لا يكون هناك مالك أوامر بعد، لذلك يظل إعداد المالك الواحد يعمل من دون تكرار المعرّفات تحت `execApprovals.approvers`.

    يعرض التسليم إلى القناة نص الأمر في الدردشة؛ لا تفعّل `channel` أو `both` إلا في مجموعات/موضوعات موثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضياً.

    تتطلب أزرار الموافقة المضمنة أيضاً أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ وتحل الأخرى عبر موافقات التنفيذ أولاً.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، يمكن أن يرد Telegram بنص الخطأ أو يكتمه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                              | القيم             | الافتراضي | الوصف                                                                                         |
| ----------------------------------- | ----------------- | --------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى المحادثة. يكتم `silent` ردود الأخطاء بالكامل.                 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى المحادثة نفسها. يمنع فيضان الأخطاء أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس الوراثة مثل مفاتيح إعداد Telegram الأخرى).

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
  <Accordion title="لا يرد الروبوت على رسائل المجموعة التي لا تحتوي على إشارة">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل الروبوت من المجموعة وأعد إضافته إليها
    - يحذر `openclaw channels status` عندما تتوقع الإعدادات رسائل مجموعة بلا إشارة.
    - يمكن لـ `openclaw channels status --probe` التحقق من معرفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص العضوية باستخدام حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="الروبوت لا يرى رسائل المجموعة إطلاقا">

    - عندما يكون `channels.telegram.groups` موجودا، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية الروبوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيا أو لا تعمل إطلاقا">

    - خوّل هوية المرسل الخاصة بك (الاقتران و/أو `allowFrom` الرقمي)
    - ما يزال تخويل الأوامر مطبقا حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدا؛ قلل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة وتُعاد محاولة تنفيذها مرة واحدة عبر بديل نقل Telegram عند انتهاء مهلة الطلب. عادة ما تشير أخطاء الشبكة/الجلب المستمرة إلى مشكلات في قابلية الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلغ عن رمز غير مخول">

    - `getMe returned 401` هو فشل مصادقة من Telegram لرمز الروبوت المهيأ.
    - أعد نسخ رمز الروبوت أو أنشئه من جديد في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضا فشل مصادقة؛ معاملته على أنها "لا يوجد Webhook" ستؤجل فقط فشل الرمز السيئ نفسه إلى استدعاءات API اللاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/وكيل مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - بعض المضيفين يحلون `api.telegram.org` إلى IPv6 أولا؛ وقد يتسبب خروج IPv6 المعطل في إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستقصاء، يعيد OpenClaw استخدام فحص بدء التشغيل الناجح `getMe` لصالح grammY بحيث لا يحتاج المشغل إلى `getMe` ثان قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، يتابع OpenClaw إلى الاستقصاء الطويل بدلا من إجراء استدعاء آخر إلى مستوى التحكم قبل الاستقصاء. يظهر Webhook ما يزال نشطا كتعارض في `getUpdates`؛ عندها يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا كانت مآخذ Telegram تُعاد تدويرها وفق إيقاع ثابت قصير، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ يقيّد عملاء الروبوت القيم المهيأة تحت حراس الطلبات الصادرة و`getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تجهض كل استقصاء أو رد عندما كانت هذه القيمة مضبوطة دون تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية بلا اكتمال لحيوية الاستقصاء الطويل افتراضيا.
    - يحذر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستقصاء قديما.
    - لا تزد `channels.telegram.pollingStallThresholdMs` إلا عندما تكون استدعاءات `getUpdates` الطويلة سليمة لكن مضيفك ما يزال يبلغ زورا عن إعادات تشغيل بسبب تعثر الاستقصاء. التعثرات المستمرة تشير عادة إلى مشكلات في الوكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يحترم Telegram أيضا متغيرات بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` وصيغها بالأحرف الصغيرة. ما يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان وكيل OpenClaw المُدار مهيأ عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد بيئة وكيل قياسية، فإن Telegram يستخدم ذلك URL لنقل Bot API أيضا.
    - على مضيفي VPS ذوي الخروج/TLS المباشر غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضيا `autoSelectFamily=true` (باستثناء WSL2). يراعي ترتيب نتائج DNS في Telegram `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم الإعداد الافتراضي للعملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحة بشكل أفضل بسلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق اختبارات RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيا. إذا كان fake-IP موثوق أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/مخصص لاستخدام خاص أثناء تنزيلات الوسائط، يمكنك الاشتراك
      في تجاوز خاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر خيار الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان وكيلك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلم الخطر معطلا أولا. تسمح وسائط Telegram بالفعل بنطاق اختبارات
      RFC 2544 افتراضيا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية Telegram
      للوسائط من SSRF. استخدمه فقط لبيئات الوكيل الموثوقة التي يتحكم بها المشغل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما
      تُنشئ إجابات خاصة أو مخصصة لاستخدام خاص خارج نطاق اختبارات RFC 2544.
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

مزيد من المساعدة: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الدلالة">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` ذات المستوى الأعلى (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- الترابط/الردود: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- البث: `streaming` (معاينة), `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أولوية الحسابات المتعددة: عند تهيئة معرفي حساب أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحا. وإلا يعود OpenClaw إلى أول معرف حساب مُطبّع ويحذر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Telegram بالـ Gateway.
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
  <Card title="توجيه الوكلاء المتعددين" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والمواضيع بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عابرة للقنوات.
  </Card>
</CardGroup>
