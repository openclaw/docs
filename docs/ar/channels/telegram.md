---
read_when:
    - العمل على ميزات Telegram أو Webhooks
summary: حالة دعم بوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-12T12:48:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 185ac6051d3da2037b2727a6afca98bef946bc62c3f2b22cc9afe9831669297b
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل البوت المباشرة والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية لـ Telegram هي الاقتران.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعدادات القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="Create the bot token in BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد أن المعرّف هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع المطالبات، واحفظ الرمز المميز.

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

    بديل البيئة: `TELEGRAM_BOT_TOKEN=...` (الحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز المميز في الإعدادات/البيئة، ثم ابدأ Gateway.

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
    أضف البوت إلى مجموعتك، ثم احصل على كلا المعرّفين اللذين يحتاجهما وصول المجموعة:

    - معرّف مستخدم Telegram الخاص بك، ويُستخدم في `allowFrom` / `groupAllowFrom`
    - معرّف دردشة مجموعة Telegram، ويُستخدم مفتاحًا ضمن `channels.telegram.groups`

    للإعداد لأول مرة، احصل على معرّف دردشة المجموعة من `openclaw logs --follow`، أو بوت يمرر المعرّفات، أو Bot API `getUpdates`. بعد السماح للمجموعة، يمكن لـ `/whoami@<bot_username>` تأكيد معرّفات المستخدم والمجموعة.

    معرّفات مجموعات Telegram الفائقة السالبة التي تبدأ بـ `-100` هي معرّفات دردشة مجموعات. ضعها ضمن `channels.telegram.groups`، وليس ضمن `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتيب حل الرمز المميز واعٍ بالحساب. عمليًا، تتغلب قيم الإعدادات على بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    تعتمد بوتات Telegram افتراضيًا على **وضع الخصوصية**، الذي يحد من رسائل المجموعات التي تستقبلها.

    إذا كان يجب على البوت رؤية كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="Group permissions">
    تتحكم إعدادات مجموعة Telegram في حالة المشرف.

    تستقبل بوتات المشرفين كل رسائل المجموعة، وهو أمر مفيد لسلوك المجموعة الدائم التشغيل.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك رؤية المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.telegram.dmPolicy` في وصول الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد أو يخمّن اسم مستخدم البوت أن يأمر البوت. استخدمه فقط للبوتات العامة المقصودة ذات الأدوات المقيدة بإحكام؛ ويجب أن تستخدم بوتات المالك الواحد `allowlist` مع معرّفات مستخدم رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئات `telegram:` / `tg:` وتُوحّد.
    في إعدادات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` المقيّد على المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا كانت قائمة السماح الفعالة للحساب لا تزال تحتوي على بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة، ويرفضه تحقق الإعدادات.
    يطلب الإعداد معرّفات المستخدم الرقمية فقط.
    إذا أجريت ترقية وكانت إعداداتك تحتوي على إدخالات قائمة سماح بصيغة `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، يمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    لبوتات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول دائمة في الإعدادات (بدل الاعتماد على موافقات اقتران سابقة).

    التباس شائع: موافقة اقتران الرسائل المباشرة لا تعني "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران وصول الرسائل المباشرة. إذا لم يكن هناك مالك أوامر بعد، فإن أول اقتران معتمد يضبط أيضًا `commands.ownerAllowFrom` بحيث يكون للأوامر الخاصة بالمالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تفويض مرسل المجموعة يأتي من قوائم السماح الصريحة في الإعدادات.
    إذا كنت تريد "أنا مخوّل مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ وللأوامر الخاصة بالمالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (بدون بوت طرف ثالث):

    1. أرسل رسالة مباشرة إلى البوت الخاص بك.
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

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - لا توجد إعدادات `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **ما المرسلون المسموح بهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُوحّد البادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة ضمن `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسل المجموعة موافقات مخزن اقتران الرسائل المباشرة.
    يبقى الاقتران خاصًا بالرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى إعداد `allowFrom`، وليس مخزن الاقتران.
    نمط عملي لبوتات المالك الواحد: اضبط معرّف مستخدمك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا تمامًا، فإن وقت التشغيل يستخدم افتراضيًا `groupPolicy="allowlist"` بإغلاق آمن ما لم يُضبط `channels.defaults.groupPolicy` صراحة.

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

    اختبره من المجموعة باستخدام `@<bot_username> ping`. لا تؤدي رسائل المجموعة العادية إلى تشغيل البوت عندما تكون `requireMention: true`.

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
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تحديد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد تمكين أي عضو في مجموعة مسموح بها من التحدث إلى البوت.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    تتطلب ردود المجموعات ذكرًا افتراضيًا.

    يمكن أن يأتي الذكر من:

    - ذكر `@botusername` أصلي، أو
    - أنماط الذكر في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه حالة الجلسة فقط. استخدم الإعدادات للاستمرارية.

    مثال إعدادات دائم:

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

    - مرّر رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص Bot API `getUpdates`
    - بعد السماح للمجموعة، شغّل `/whoami@<bot_username>` إذا كانت الأوامر الأصلية مفعلة

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- Telegram مملوك لعملية Gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُوحّد الرسائل الواردة في مغلف القناة المشترك مع بيانات الرد الوصفية، وعناصر نائبة للوسائط، وسياق سلسلة ردود مستمر لردود Telegram التي رصدها Gateway.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف موضوعات المنتدى `:topic:<threadId>` لإبقاء الموضوعات معزولة.
- يمكن لرسائل الرسائل المباشرة حمل `message_thread_id`؛ يحافظ OpenClaw على معرّف الخيط للردود لكنه يُبقي الرسائل المباشرة على الجلسة المسطحة افتراضيًا. اضبط `channels.telegram.dm.threadReplies: "inbound"`، أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"`، أو `requireTopic: true`، أو إعداد موضوع مطابقًا عندما تريد عمدًا عزل جلسات موضوعات الرسائل المباشرة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل دردشة/كل خيط. يستخدم تزامن مصرف المشغّل العام `agents.defaults.maxConcurrent`.
- الاستقصاء الطويل محمي داخل كل عملية Gateway بحيث يمكن لمستطلع نشط واحد فقط استخدام رمز بوت في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستطلعًا خارجيًا يستخدم الرمز نفسه.
- يتم تشغيل عمليات إعادة تشغيل مراقب الاستقصاء الطويل بعد 120 ثانية بدون اكتمال حيوية `getUpdates` افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك لا يزال يرى عمليات إعادة تشغيل خاطئة لتوقف الاستقصاء أثناء العمل طويل المدى. القيمة بالميلي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    يمكن لـ OpenClaw بث ردود جزئية في الوقت الحقيقي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هي `off | partial | block | progress` (الافتراضي: `partial`)
    - يحافظ `progress` على مسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويمحوها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` في ما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة نفسها بعد تحريرها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل أسطر تقدم الأدوات تلك: `raw` (الافتراضي، يحافظ على السلوك الصادر) أو `status` (تسمية الأداة فقط)
    - يتم اكتشاف `channels.telegram.streamMode` القديم وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، أو ملخصات التصحيحات. يبقي Telegram هذه مفعلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده. للإبقاء على المعاينة المحررة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، عيّن:

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

    للإبقاء على تقدم الأدوات مرئيًا مع إخفاء نص الأمر/التنفيذ، عيّن:

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

    استخدم وضع `progress` عندما تريد تقدم أدوات مرئيًا دون تحرير الإجابة النهائية في تلك الرسالة نفسها. ضع سياسة نص الأمر تحت `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطّل تعديلات معاينة Telegram ويتم كتم رسائل الأدوات/التقدم العامة بدلًا من إرسالها كرسائل حالة مستقلة. تظل مطالبات الموافقة، وحمولات الوسائط، والأخطاء تمر عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط الإبقاء على تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تحرير معاينة الإجابة، لذلك لا يمكن لـ `streaming.preview.toolProgress` إظهار أسطر الحالة القصيرة لتلك الجولة. لا تزال ردود الرسالة الحالية من دون نص اقتباس محدد تحتفظ ببث المعاينة. عيّن `replyToMode: "off"` عندما تكون رؤية تقدم الأدوات أهم من ردود الاقتباس الأصلية، أو عيّن `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات الرسائل المباشرة/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري التحرير النهائي في مكانه
    - الردود النصية النهائية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الحالية كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - الردود النهائية في وضع التقدم تمحو مسودة الحالة وتستخدم التسليم النهائي العادي بدلًا من تحرير المسودة لتصبح الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عند تفعيل بث الكتل صراحةً لـ Telegram، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة المباشرة أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما يجب أن يظل الاستدلال مرئيًا
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع إلى HTML">
    يستخدم النص الصادر `parse_mode: "HTML"` في Telegram.

    - يُعرض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - تُحفظ وسوم HTML المدعومة في Telegram؛ ويُهرّب HTML غير المدعوم.
    - إذا رفض Telegram HTML المحلل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

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

    - تُطبّع الأسماء (إزالة `/` في البداية، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، الطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - تُتجاوز التعارضات/التكرارات وتُسجّل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن لأوامر plugin/skill أن تستمر في العمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا عُطّلت الأوامر الأصلية، تُزال الأوامر المضمنة. قد تظل أوامر مخصصة/Plugin قادرة على التسجيل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما زالت تتجاوز الحد بعد التقليص؛ قلّل أوامر plugin/skill/المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API أن `channels.telegram.apiRoot` ضُبط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` العرضية.
    - يعني `getMe returned 401` أن Telegram رفض رمز الروبوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستطلاع لذلك لا يُبلّغ عن هذا كفشل تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin `device-pair`)

    عند تثبيت Plugin `device-pair`:

    1. يولّد `/pair` رمز الإعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. تُبقي عملية تسليم التمهيد المضمنة رمز العقدة الأساسي عند `scopes: []`؛ وأي رمز مشغل مُسلّم يبقى مقيدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. فحوصات نطاق التمهيد مسبوقة بالدور، لذلك لا تلبي قائمة السماح الخاصة بالمشغل إلا طلبات المشغل؛ ما زالت الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة الدور الخاصة بها.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

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

    يطابق `capabilities: ["inlineButtons"]` القديم إلى `inlineButtons: "all"`.

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

    تُمرر نقرات Callback إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أدوات Telegram:

    - `sendMessage` (`to`، `content`، `mediaUrl` اختياري، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، `iconColor` اختياري، `iconCustomEmojiId`)

    تكشف إجراءات رسائل القناة أسماء مستعارة سهلة الاستخدام (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر تحكم الحجب:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: `edit` و`topic-create` مفعلان حاليًا افتراضيًا وليست لهما مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم الإرسالات وقت التشغيل لقطة الإعداد/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تجري مسارات الإجراءات إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم سلاسل الرد">
    يدعم Telegram وسوم سلاسل رد صريحة في المخرجات المولدة:

    - يرد `[[reply_to_current]]` على الرسالة التي شغّلت الطلب
    - يرد `[[reply_to:<id>]]` على معرف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    عند تفعيل سلاسل الرد وتوفر نص Telegram الأصلي أو التعليق، يدرج OpenClaw مقتطف اقتباس أصلي من Telegram تلقائيًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطل `off` سلاسل الرد الضمنية. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتدى:

    - تضيف مفاتيح جلسة الموضوع `:topic:<threadId>`
    - تستهدف الردود وإجراءات الكتابة سلسلة الموضوع
    - مسار إعداد الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف إرسالات الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - ما زالت إجراءات الكتابة تتضمن `message_thread_id`

    توريث الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من الإعدادات الافتراضية للمجموعة.

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

    يصبح لكل موضوع عندئذ مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط موضوع ACP الدائم**: يمكن لموضوعات المنتدى تثبيت جلسات حزمة ACP عبر روابط ACP typed ذات المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي يقتصر على موضوعات المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالمحادثة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتوجّه المتابعات إليها مباشرة. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعلا (القيمة الافتراضية: `true`).

    يعرّض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة وبيانات الرد الوصفية في جلسات مسطحة افتراضيا؛ ولا تستخدم مفاتيح جلسات مدركة للمحادثات إلا عند تكوينها باستخدام `threadReplies: "inbound"` أو `threadReplies: "always"` أو `requireTopic: true` أو تكوين موضوع مطابق. استخدم `channels.telegram.dm.threadReplies` ذي المستوى الأعلى للقيمة الافتراضية للحساب، أو `direct.<chatId>.threadReplies` لرسالة مباشرة واحدة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية والملفات الصوتية.

    - الافتراضي: سلوك الملف الصوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطر نصوص الملاحظات الصوتية الواردة كنص مولد آليا وغير موثوق في سياق الوكيل؛ ويظل اكتشاف الإشارات يستخدم النص الخام بحيث تستمر الرسائل الصوتية المحكومة بالإشارات في العمل.

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ يُرسل نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزل ويُعالج (العنصر النائب `<media:sticker>`)
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

    توصف الملصقات مرة واحدة (عند الإمكان) وتُخزن مؤقتا لتقليل استدعاءات الرؤية المتكررة.

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
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند تفعيلها، يضع OpenClaw أحداث نظام مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    التكوين:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة تخزين مؤقت للرسائل المرسلة).
    - تظل أحداث التفاعل تحترم عناصر تحكم الوصول في Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ وتُسقط الجهات المرسلة غير المصرح لها.
    - لا يوفر Telegram معرفات المحادثات في تحديثات التفاعل.
      - تُوجه المجموعات غير المنتدية إلى جلسة دردشة المجموعة
      - تُوجه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/Webhook قيمة `message_reaction` تلقائيا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمز إيموجي للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - رجوع احتياطي إلى إيموجي هوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram إيموجي unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات التكوين من أحداث وأوامر Telegram">
    تكون كتابات تكوين القناة مفعلة افتراضيا (`configWrites !== false`).

    تشمل الكتابات المشغلة من Telegram:

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

  <Accordion title="الاستقصاء الطويل مقابل Webhook">
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ اختياريا `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    في وضع الاستقصاء الطويل، يحفظ OpenClaw علامة إعادة التشغيل المائية فقط بعد إرسال التحديث بنجاح. إذا فشل معالج، يظل ذلك التحديث قابلا لإعادة المحاولة في العملية نفسها ولا يُكتب كمكتمل لإزالة تكرار إعادة التشغيل.

    يرتبط المستمع المحلي بـ `127.0.0.1:8787`. للدخول العام، إما ضع وكيلا عكسيا أمام المنفذ المحلي أو عيّن `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    يعالج OpenClaw بعد ذلك التحديث بشكل غير متزامن عبر المسارات نفسها لكل دردشة/لكل موضوع في البوت المستخدمة في الاستقصاء الطويل، لذلك لا تجعل دورات الوكيل البطيئة ACK التسليم الخاص بـ Telegram منتظرا.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِدها إذا كانت أجزاء الألبوم تصل متأخرة؛ وقللها لتقليل زمن تأخر الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل API في Telegram (إذا لم يُعين، تطبق القيمة الافتراضية لـ grammY). تقيّد عملاء البوت القيم المكوّنة الأقل من حارس طلب النص/الكتابة الصادر البالغ 60 ثانية حتى لا يوقف grammY تسليم الرد المرئي قبل أن يتمكن حارس نقل OpenClaw والرجوع الاحتياطي من العمل. لا يزال الاستقصاء الطويل يستخدم حارس طلب `getUpdates` مدته 45 ثانية حتى لا تُترك عمليات الاستقصاء الخاملة إلى أجل غير محدد.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل تعثر الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتقوم `0` بالتعطيل.
    - يُطبع سياق الرد/الاقتباس/إعادة التوجيه التكميلي في نافذة سياق محادثة مختارة واحدة عندما يكون Gateway قد رصد الرسائل الأصلية؛ وتُحفظ ذاكرة التخزين المؤقت للرسائل المرصودة بجوار مخزن الجلسات. لا يتضمن Telegram إلا `reply_to_message` سطحيا واحدا في التحديثات، لذلك تقتصر السلاسل الأقدم من ذاكرة التخزين المؤقت على حمولة التحديث الحالية في Telegram.
    - تتحكم قوائم السماح في Telegram بشكل أساسي في من يمكنه تشغيل الوكيل، وليست حدا كاملا لتنقيح السياق التكميلي.
    - عناصر تحكم سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق تكوين `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضا إعادة محاولة إرسال آمنة ومحدودة لفشل Telegram قبل الاتصال، لكنه لا يعيد محاولة مغلفات الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال في CLI وأداة الرسائل معرف دردشة رقميا أو اسم مستخدم أو هدف موضوع منتدى:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    تستخدم استطلاعات Telegram الأمر `openclaw message poll` وتدعم موضوعات المنتدى:

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
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب التسليم المثبت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وGIF ومقاطع الفيديو الصادرة كمستندات بدلا من تحميلات الصور المضغوطة أو الوسائط المتحركة أو الفيديو

    حوكمة الإجراءات:

    - يعطل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يعطل `channels.telegram.actions.poll=false` إنشاء استطلاعات Telegram مع ترك الإرسال العادي مفعلا

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين ويمكنه اختياريا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرفات مستخدمي Telegram رقمية.

    مسار التكوين:

    - `channels.telegram.execApprovals.enabled` (يفعّل تلقائيا عندما يكون هناك موافق واحد على الأقل قابل للحل)
    - `channels.telegram.execApprovals.approvers` (يرجع احتياطيا إلى معرفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    تتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. وهي لا تجعل شخصا ما موافقا على التنفيذ. يقوم أول اقتران رسالة مباشرة معتمد بتمهيد `commands.ownerAllowFrom` عندما لا يكون هناك مالك أوامر بعد، بحيث يظل إعداد المالك الواحد يعمل دون تكرار المعرفات تحت `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في الدردشة؛ فعّل `channel` أو `both` فقط في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيا.

    تتطلب أزرار الموافقة المضمنة أيضا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح المستهدف (`dm` أو `group` أو `all`). تُحل معرفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ وتُحل الأخرى عبر موافقات التنفيذ أولا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الخطأ

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، يمكن أن يرد Telegram بنص الخطأ أو يكتمه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                   |
| ----------------------------------- | ----------------- | --------- | --------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى المحادثة. يكتم `silent` ردود الخطأ بالكامل.            |
| `channels.telegram.errorCooldownMs` | عدد (ms)          | `60000`   | الحد الأدنى للوقت بين ردود الخطأ إلى المحادثة نفسها. يمنع رسائل الخطأ المزعجة أثناء الانقطاعات. |

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
  <Accordion title="لا يستجيب البوت لرسائل المجموعة التي لا تتضمن إشارة إليه">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت من المجموعة وأعد إضافته
    - يحذر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة بلا إشارة.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ لا يمكن فحص العضوية باستخدام حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="لا يرى البوت رسائل المجموعة إطلاقًا">

    - عندما يكون `channels.telegram.groups` موجودًا، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - يظل تخويل الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني فشل `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skill/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تُقيّد استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` وتُعاد المحاولة مرة واحدة عبر آلية الرجوع في نقل Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادةً إلى مشكلات في إمكانية الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="يبلّغ بدء التشغيل عن رمز غير مصرّح به">

    - `getMe returned 401` هو فشل مصادقة من Telegram لرمز البوت المضبوط.
    - أعد نسخ رمز البوت أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضًا فشل مصادقة؛ معاملته على أنه "لا يوجد Webhook" لن يؤدي إلا إلى تأجيل فشل الرمز غير الصالح نفسه إلى استدعاءات API لاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/proxy مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يؤدي خروج IPv6 المعطّل إلى إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، يعيد OpenClaw الآن المحاولة مع هذه الأخطاء باعتبارها أخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستقصاء، يعيد OpenClaw استخدام فحص بدء التشغيل الناجح `getMe` لـ grammY حتى لا يحتاج المشغّل إلى `getMe` ثانٍ قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، يواصل OpenClaw إلى الاستقصاء الطويل بدلًا من إجراء استدعاء آخر في مستوى التحكم قبل الاستقصاء. يظهر Webhook الذي لا يزال نشطًا كتعارض `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويحاول تنظيف Webhook مجددًا.
    - إذا كانت مقابس Telegram تُعاد تدويرها بوتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ تثبّت عملاء البوت القيم المضبوطة تحت حراس طلبات الخروج و`getUpdates`، لكن الإصدارات الأقدم قد تُجهض كل استقصاء أو رد عندما كانت هذه القيمة مضبوطة دون تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية دون اكتمال نبض حياة الاستقصاء الطويل افتراضيًا.
    - يحذر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستقصاء قديمًا.
    - لا تزد `channels.telegram.pollingStallThresholdMs` إلا عندما تكون استدعاءات `getUpdates` الطويلة سليمة لكن مضيفك لا يزال يبلّغ عن عمليات إعادة تشغيل كاذبة بسبب تعثر الاستقصاء. تشير التعثرات المستمرة عادةً إلى مشكلات في proxy أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يراعي Telegram أيضًا متغيرات بيئة proxy الخاصة بالعملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` وصيغها بالأحرف الصغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا ضُبط proxy المُدار من OpenClaw عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولم تكن هناك متغيرات بيئة proxy قياسية، يستخدم Telegram ذلك URL لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج مباشر/TLS غير مستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2). يراعي ترتيب نتائج DNS في Telegram `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراضي العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ إذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل بوضوح بشكل أفضل مع سلوك IPv4 فقط، فأجبر اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق معيار RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيًا. إذا كان fake-IP موثوق أو
      proxy شفاف يعيد كتابة `api.telegram.org` إلى عنوان خاص/داخلي/ذي استخدام خاص
      آخر أثناء تنزيلات الوسائط، يمكنك الاشتراك في التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب في
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولًا. تسمح وسائط Telegram بالفعل بنطاق معيار RFC 2544
      افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية Telegram
      لوسائط SSRF. استخدمه فقط في بيئات proxy الموثوقة التي يتحكم بها المشغّل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تُنشئ
      إجابات خاصة أو ذات استخدام خاص خارج نطاق معيار RFC 2544
      المعياري. اتركه معطلًا للوصول العادي إلى Telegram عبر الإنترنت العام.
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

<Accordion title="حقول Telegram عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, المستوى الأعلى `bindings[]` (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- الترابط/الردود: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- البث: `streaming` (معاينة), `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API المخصص: `apiRoot` (جذر Bot API فقط؛ لا تُضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند ضبط معرّفي حسابين أو أكثر، عيّن `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يعود OpenClaw إلى أول معرّف حساب مُطبّع ويحذر `openclaw doctor`. ترث الحسابات المسماة قيم `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Telegram بالـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والموضوعات.
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
