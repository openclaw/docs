---
read_when:
    - العمل على ميزات Telegram أو Webhookات
summary: حالة دعم روبوت Telegram وقدراته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-06-30T14:00:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e143096bbcdf949ef11566ffe2a5360eea261cd5bf99f0cf90d31c8e9d4637d6
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل البوت المباشرة والمجموعات عبر grammY. الاقتراع الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية لـ Telegram هي الإقران.
  </Card>
  <Card title="استكشاف مشكلات القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات وخطط إصلاح عبر القنوات.
  </Card>
  <Card title="تكوين Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة تكوين القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد أن المعرّف هو بالضبط `@BotFather`).

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

    بديل البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ كوّن الرمز في التكوين/البيئة، ثم ابدأ Gateway.

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
    أضف البوت إلى مجموعتك، ثم احصل على كلا المعرّفين اللذين يحتاجهما وصول المجموعة:

    - معرّف مستخدم Telegram الخاص بك، المستخدم في `allowFrom` / `groupAllowFrom`
    - معرّف دردشة مجموعة Telegram، المستخدم كمفتاح تحت `channels.telegram.groups`

    للإعداد لأول مرة، احصل على معرّف دردشة المجموعة من `openclaw logs --follow`، أو بوت معرّفات مُعاد توجيهها، أو Bot API `getUpdates`. بعد السماح للمجموعة، يمكن لـ `/whoami@<bot_username>` تأكيد معرّفات المستخدم والمجموعة.

    معرّفات مجموعات Telegram الفائقة السالبة التي تبدأ بـ `-100` هي معرّفات دردشة مجموعات. ضعها تحت `channels.telegram.groups`، وليس تحت `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتيب حل الرمز مدرك للحساب. عمليًا، تنتصر قيم التكوين على بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
بعد بدء تشغيل ناجح، يخزّن OpenClaw هوية البوت مؤقتًا في دليل الحالة لمدة تصل إلى 24 ساعة حتى يمكن لعمليات إعادة التشغيل تجنب استدعاء Telegram `getMe` إضافي؛ تغيير الرمز أو إزالته يمسح ذاكرة التخزين المؤقت تلك.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، الذي يحد مما تستقبله من رسائل المجموعة.

    إذا كان يجب أن يرى البوت كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت وأعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُتحكم حالة المشرف في إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة كل رسائل المجموعة، وهذا مفيد لسلوك المجموعة الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح تبديل BotFather المفيدة">

    - `/setjoingroups` للسماح/رفض إضافات المجموعات
    - `/setprivacy` لسلوك رؤية المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

### هوية بوت المجموعة

في مجموعات Telegram وموضوعات المنتديات، تُعامل الإشارة الصريحة إلى معرّف البوت المكوّن (مثل `@my_bot`) على أنها توجيه إلى وكيل OpenClaw المحدد، حتى عندما يختلف اسم شخصية الوكيل عن اسم مستخدم Telegram. تظل سياسة صمت المجموعة منطبقة على حركة المجموعة غير ذات الصلة، لكن معرّف البوت نفسه لا يُعد "شخصًا آخر".

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في وصول الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد أو يخمّن اسم مستخدم البوت أن يأمر البوت. استخدمه فقط للبوتات العامة عمدًا مع أدوات مقيّدة بإحكام؛ يجب أن تستخدم البوتات ذات المالك الواحد `allowlist` مع معرّفات مستخدم رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئات `telegram:` / `tg:` وتُطبّع.
    في تكوينات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` التقييدي في المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا ما لم تظل قائمة السماح الفعلية للحساب تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة ويُرفض بواسطة تحقق التكوين.
    يطلب الإعداد معرّفات المستخدم الرقمية فقط.
    إذا أجريت ترقية وكان تكوينك يحتوي على إدخالات قائمة سماح `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة سماح مخزن الإقران، فيمكن لـ `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    للبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول دائمة في التكوين (بدلًا من الاعتماد على موافقات إقران سابقة).

    التباس شائع: لا تعني موافقة إقران الرسائل المباشرة أن "هذا المرسل مخوّل في كل مكان".
    يمنح الإقران وصول الرسائل المباشرة. إذا لم يكن مالك أوامر موجودًا بعد، يعيّن أول إقران موافق عليه أيضًا `commands.ownerAllowFrom` حتى يكون للأوامر الخاصة بالمالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تفويض مرسل المجموعة يأتي من قوائم سماح التكوين الصريحة.
    إذا أردت "أنا مخوّل مرة واحدة وتعمل الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ وللأوامر الخاصة بالمالك فقط، تأكد أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (دون بوت تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى بوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة جهة خارجية (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعة وقوائم السماح">
    ينطبق عنصران تحكمان معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - لا يوجد تكوين `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم تكوين `groups`: يعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **ما المرسلون المسموح بهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسل المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة تحت `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسل المجموعة موافقات مخزن إقران الرسائل المباشرة.
    يبقى الإقران للرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/لكل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى تكوين `allowFrom`، وليس مخزن الإقران.
    النمط العملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا تمامًا، فإن وقت التشغيل يستخدم افتراضيًا `groupPolicy="allowlist"` المغلق بالفشل ما لم يُضبط `channels.defaults.groupPolicy` صراحة.

    إعداد مجموعة للمالك فقط:

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

    اختبره من المجموعة باستخدام `@<bot_username> ping`. لا تؤدي رسائل المجموعة العادية إلى تشغيل البوت عندما يكون `requireMention: true`.

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
    تتطلب ردود المجموعة الإشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة `@botusername` الأصلية، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    لا تحدّث هذه إلا حالة الجلسة. استخدم التكوين للاستمرارية.

    مثال تكوين دائم:

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

    يكون سياق سجل المجموعة افتراضيًا `mention-only`: تُضمّن رسائل المجموعة السابقة
    فقط عندما تكون موجّهة إلى البوت، أو ردودًا على البوت،
    أو رسائل البوت نفسه. اضبط `includeGroupHistoryContext: "recent"` من أجل
    تضمين سجل الغرفة الحديث للمجموعات الموثوقة. اضبط
    `includeGroupHistoryContext: "none"` لعدم إرسال أي سجل سابق لمجموعة Telegram
    مع الدور التالي.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    الحصول على معرّف دردشة المجموعة:

    - أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص Bot API `getUpdates`
    - بعد السماح للمجموعة، شغّل `/whoami@<bot_username>` إذا كانت الأوامر الأصلية مفعّلة

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- Telegram مملوك لعملية Gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى مظروف القناة المشترك مع بيانات تعريف الرد، وعناصر نائبة للوسائط، وسياق سلسلة الردود المحفوظ لردود Telegram التي رصدها Gateway.
- تُعزل جلسات المجموعات بحسب معرّف المجموعة. تضيف مواضيع المنتدى `:topic:<threadId>` لإبقاء المواضيع معزولة.
- يمكن أن تحمل رسائل DM قيمة `message_thread_id`؛ يحتفظ OpenClaw بها للردود. لا تنقسم جلسات مواضيع DM إلا عندما يبلغ Telegram `getMe` عن `has_topics_enabled: true` للبوت؛ وإلا تبقى رسائل DM على الجلسة المسطحة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل محادثة/كل سلسلة. يستخدم تزامن مصرف المشغّل الكلي `agents.defaults.maxConcurrent`.
- يحد بدء التشغيل متعدد الحسابات من فحوصات Telegram `getMe` المتزامنة حتى لا توسّع أساطيل البوتات الكبيرة كل فحص حساب دفعة واحدة.
- يُحرس الاستقصاء الطويل داخل كل عملية Gateway حتى لا يستطيع استخدام رمز البوت إلا مستقصٍ نشط واحد في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تُشغّل إعادة تشغيل مراقب الاستقصاء الطويل افتراضيًا بعد 120 ثانية من دون اكتمال صلاحية `getUpdates`. زِد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك لا يزال يرى عمليات إعادة تشغيل خاطئة بسبب توقف الاستقصاء أثناء عمل طويل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

<Note>
  أُزيلت `channels.telegram.dm.threadReplies` و`channels.telegram.direct.<chatId>.threadReplies`. شغّل `openclaw doctor --fix` بعد الترقية إذا كان إعدادك لا يزال يحتوي على هذه المفاتيح. يتبع توجيه مواضيع DM الآن قدرة البوت من Telegram `getMe.has_topics_enabled`، التي يتحكم بها وضع السلاسل في BotFather: تستخدم البوتات المفعّلة للمواضيع جلسات DM محددة بالسلسلة عندما يرسل Telegram قيمة `message_thread_id`؛ وتبقى رسائل DM الأخرى على الجلسة المسطحة.
</Note>

## مرجع الميزات

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    يستطيع OpenClaw بث الردود الجزئية في الوقت الحقيقي:

    - المحادثات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلبات:

    - `channels.telegram.streaming` هي `off | partial | block | progress` (الافتراضي: `partial`)
    - تُؤخّر معاينات الإجابة الأولية القصيرة، ثم تُنشأ بعد تأخير محدود إذا كان التشغيل لا يزال نشطًا
    - يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويعرض تسمية الحالة المستقرة عندما يصل نشاط الإجابة قبل تقدم الأداة، ويمسحها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة المحررة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل أسطر تقدم الأدوات هذه: `raw` (الافتراضي، يحافظ على السلوك الصادر) أو `status` (تسمية الأداة فقط)
    - يفعّل `streaming.progress.commentary` (الافتراضي: `false`) نص تعليق/تمهيد المساعد في مسودة التقدم المؤقتة
    - تُكتشف `channels.telegram.streamMode` القديمة، وقيم `streaming` المنطقية، ومفاتيح معاينة المسودة الأصلية المتقاعدة؛ شغّل `openclaw doctor --fix` لترحيلها إلى إعداد البث الحالي

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءات الملفات، وتحديثات التخطيط، وملخصات التصحيحات، أو نص تمهيد/تعليق Codex في وضع خادم تطبيق Codex. يُبقي Telegram هذه مفعّلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده.

    للإبقاء على المعاينة المحررة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

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

    للإبقاء على تقدم الأدوات مرئيًا مع إخفاء نص الأمر/التنفيذ، اضبط:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطّل تعديلات معاينة Telegram ويُكبت حديث الأداة/التقدم العام بدل إرساله كرسائل حالة مستقلة. لا تزال مطالبات الموافقة، وحمولات الوسائط، والأخطاء تُوجّه عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    <Note>
      تُعد ردود الاقتباس المحددة في Telegram الاستثناء. عندما تكون `replyToMode` هي `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدل تحرير معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` عرض أسطر الحالة القصيرة لذلك الدور. لا تزال ردود الرسالة الحالية من دون نص اقتباس محدد تحتفظ ببث المعاينة. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأدوات أهم من ردود الاقتباس الأصلية، أو اضبط `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات DM/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها وينفذ التحرير النهائي في مكانه
    - النهايات النصية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الحالية كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - تمسح نهايات وضع التقدم مسودة الحالة وتستخدم التسليم النهائي العادي بدل تحرير المسودة إلى الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يُفعّل بث الكتل صراحةً لـ Telegram، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

    سلوك بث الاستدلال:

    - يستخدم `/reasoning stream` مسار معاينة الاستدلال في قناة مدعومة؛ على Telegram، يبث الاستدلال إلى المعاينة الحية أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما يجب أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="Rich message formatting">
    يستخدم النص الصادر رسائل Telegram HTML القياسية افتراضيًا حتى تبقى الردود مقروءة عبر عملاء Telegram الحاليين. يدعم وضع التوافق هذا التنسيق العادي الغامق، والمائل، والروابط، والكود، والمحتوى المخفي، والاقتباسات، لكنه لا يدعم كتل Bot API 10.1 الغنية فقط مثل الجداول الأصلية، والتفاصيل، والوسائط الغنية، والصيغ.

    اضبط `channels.telegram.richMessages: true` لتفعيل رسائل Bot API 10.1 الغنية:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    عند التفعيل:

    - يُخبر الوكيل بأن رسائل Telegram الغنية متاحة لهذا البوت/الحساب.
    - يُعرض نص Markdown عبر Markdown IR الخاص بـ OpenClaw ويُرسل كـ Telegram HTML غني.
    - تحافظ حمولات HTML الغنية الصريحة على وسوم Bot API 10.1 المدعومة مثل العناوين، والجداول، والتفاصيل، والوسائط الغنية، والصيغ.
    - لا تزال تعليقات الوسائط تستخدم تعليقات Telegram HTML لأن الرسائل الغنية لا تستبدل التعليقات.

    يُبقي هذا نص النموذج بعيدًا عن رموز Telegram Rich Markdown، لذلك لا تُفسّر العملات مثل `$400-600K` كرياضيات. يُقسّم النص الغني الطويل تلقائيًا عبر حدود النص الغني والكتل الغنية في Telegram. تُرسل الجداول التي تتجاوز حد أعمدة Telegram ككتل كود.

    الافتراضي: معطّل لتوافق العملاء. تتطلب الرسائل الغنية عملاء Telegram متوافقين؛ يعرض بعض عملاء Desktop وWeb وAndroid والعملاء الخارجيين الحاليين الرسائل الغنية المقبولة على أنها غير مدعومة. أبقِ هذا الخيار معطّلًا ما لم يكن كل عميل مستخدم مع البوت قادرًا على عرضها. يعرض `/status` ما إذا كانت جلسة Telegram الحالية قد فعّلت الرسائل الغنية أم عطّلتها.

    تكون معاينات الروابط مفعّلة افتراضيًا. يتجاوز `channels.telegram.linkPreview: false` اكتشاف الكيانات التلقائي للنص الغني.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    يُعالج تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

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

    - تُطبّع الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، الطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - تُتجاوز التعارضات/التكرارات وتُسجّل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن أن تظل أوامر plugin/skill تعمل عند كتابتها حتى إن لم تظهر في قائمة Telegram

    إذا عُطّلت الأوامر الأصلية، تُزال الأوامر المضمنة. قد تظل أوامر custom/plugin تُسجّل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال تتجاوز الحد بعد التشذيب؛ قلّل أوامر plugin/skill/custom أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API أن `channels.telegram.apiRoot` ضُبط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء لذلك لا يُبلّغ عن هذا كفشل تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (`device-pair` plugin)

    عندما يكون `device-pair` plugin مثبتًا:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما لا يوجد إلا طلب معلق واحد
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. تمهيد رمز الإعداد المضمن خاص بالعقد فقط: ينشئ الاتصال الأول طلب عقدة معلقًا، وبعد الموافقة يعيد Gateway رمز عقدة دائمًا مع `scopes: []`. لا يعيد رمز مشغل مُسلّمًا؛ يتطلب وصول المشغل إقران مشغل منفصلًا وموافقًا عليه أو تدفق رمز.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

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
    - `allowlist` (الافتراضي)

    يطابق `capabilities: ["inlineButtons"]` القديم `inlineButtons: "all"`.

    مثال إجراء الرسالة:

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

    مثال زر التطبيق المصغر:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    تعمل أزرار Telegram `web_app` فقط في المحادثات الخاصة بين المستخدم
    والبوت.

    تُمرَّر نقرات رد الاتصال إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تشمل إجراءات أدوات Telegram:

    - `sendMessage` (`to`، `content`، اختياريًا `mediaUrl`، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content` أو `caption`، اختياريًا أزرار `presentation` المضمنة؛ تعديلات الأزرار فقط تحدّث ترميز الرد)
    - `createForumTopic` (`chatId`، `name`، اختياريًا `iconColor`، `iconCustomEmojiId`)

    تعرض إجراءات رسائل القنوات أسماء مستعارة مريحة (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر التحكم في البوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطّل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات الإرسال وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تجري مسارات الإجراءات إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم خيوط الردود">
    يدعم Telegram وسوم خيوط رد صريحة في المخرجات المولّدة:

    - يرد `[[reply_to_current]]` على الرسالة المشغِّلة
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    عندما تكون خيوط الردود مفعّلة ويكون نص Telegram الأصلي أو التعليق التوضيحي متاحًا، يدرج OpenClaw تلقائيًا مقتطف اقتباس Telegram أصليًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` خيوط الردود الضمنية. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك الخيوط">
    المجموعات الفائقة للمنتدى:

    - تضيف مفاتيح جلسات الموضوع `:topic:<threadId>`
    - تستهدف الردود ومؤشرات الكتابة خيط الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تتجاهل عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    الوراثة في الموضوعات: ترث إدخالات الموضوع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من افتراضيات المجموعة.
    يعيّن `topics."*"` افتراضيات لكل موضوع في تلك المجموعة؛ ولا تزال معرّفات الموضوع الدقيقة تتغلب على `"*"`.

    **توجيه الوكلاء لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر تعيين `agentId` في إعدادات الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    **ربط موضوع ACP الدائم**: يمكن لموضوعات المنتدى تثبيت جلسات عدة ACP عبر روابط ACP مكتوبة في المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي مخصص لموضوعات المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالخيط من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (الافتراضي: `true`).

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تحتوي على `message_thread_id` ببيانات الرد الوصفية؛ ولا تستخدم مفاتيح جلسات واعية بالخيوط إلا عندما يبلغ Telegram `getMe` عن `has_topics_enabled: true` للبوت.
    أُحيلت تجاوزات `dm.threadReplies` و`direct.*.threadReplies` السابقة إلى التقاعد عمدًا؛ استخدم وضع BotFather للخيوط كمصدر واحد للحقيقة وشغّل `openclaw doctor --fix` لإزالة مفاتيح الإعدادات القديمة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين الملاحظات الصوتية والملفات الصوتية.

    - الافتراضي: سلوك الملف الصوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطَّر تفريغات الملاحظات الصوتية الواردة كنص مولّد آليًا
      وغير موثوق في سياق الوكيل؛ لا يزال اكتشاف الإشارات يستخدم التفريغ الخام
      حتى تستمر رسائل الصوت المقيدة بالإشارات في العمل.

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

    يميّز Telegram بين ملفات الفيديو وملاحظات الفيديو.

    مثال لإجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ يُرسل نص الرسالة المقدّم بشكل منفصل.

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

    تُخزّن أوصاف الملصقات مؤقتًا في حالة Plugin الخاصة بـ OpenClaw SQLite لتقليل استدعاءات الرؤية المتكررة.

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

  <Accordion title="إشعارات التفاعل">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند تفعيلها، يضيف OpenClaw أحداث نظام مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - `own` يعني تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة الرسائل المرسلة المؤقتة).
    - تظل أحداث التفاعل ملتزمة بضوابط وصول Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ ويتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرّفات السلاسل في تحديثات التفاعل.
      - تُوجَّه المجموعات غير المنتدية إلى جلسة محادثة المجموعة
      - تُوجَّه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/Webhook قيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة. يحدد `ackReactionScope` *متى* يُرسل ذلك الرمز التعبيري فعليًا.

    **ترتيب حل الرمز التعبيري (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرمز التعبيري الاحتياطي لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

    **النطاق (`messages.ackReactionScope`):**

    يقرأ موفر Telegram النطاق من `messages.ackReactionScope` (الافتراضي `"group-mentions"`). لا يوجد اليوم تجاوز على مستوى حساب Telegram أو قناة Telegram.

    القيم: `"all"` (الرسائل المباشرة + المجموعات)، `"direct"` (الرسائل المباشرة فقط)، `"group-all"` (كل رسالة مجموعة، بلا رسائل مباشرة)، `"group-mentions"` (المجموعات عندما يُذكر البوت؛ **بلا رسائل مباشرة** — هذا هو الافتراضي)، `"off"` / `"none"` (معطل).

    <Note>
    النطاق الافتراضي (`"group-mentions"`) لا يطلق تفاعلات الإقرار في الرسائل المباشرة. للحصول على تفاعل إقرار على رسائل Telegram المباشرة الواردة، اضبط `messages.ackReactionScope` على `"direct"` أو `"all"`. تُقرأ القيمة عند بدء تشغيل موفر Telegram، لذلك يلزم إعادة تشغيل Gateway حتى يسري التغيير.
    </Note>

  </Accordion>

  <Accordion title="كتابات الإعداد من أحداث وأوامر Telegram">
    تكون كتابات إعداد القناة مفعّلة افتراضيًا (`configWrites !== false`).

    تشمل الكتابات التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و `/config unset` (يتطلب تفعيل الأوامر)

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
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook، اضبط `channels.telegram.webhookUrl` و `channels.telegram.webhookSecret`؛ واختياريًا `webhookPath`، و `webhookHost`، و `webhookPort` (الافتراضيات `/telegram-webhook`، و `127.0.0.1`، و `8787`).

    في وضع الاستقصاء الطويل، يحتفظ OpenClaw بعلامة الماء لإعادة التشغيل فقط بعد نجاح إرسال تحديث. إذا فشل معالج، يبقى ذلك التحديث قابلاً لإعادة المحاولة في العملية نفسها ولا يُكتب كمكتمل لإزالة تكرار إعادة التشغيل.

    يستمع المستمع المحلي على `127.0.0.1:8787`. للإدخال العام، ضع وكيلًا عكسيًا أمام المنفذ المحلي أو اضبط `webhookHost: "0.0.0.0"` عمدًا.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل محادثة/لكل موضوع المستخدمة في الاستقصاء الطويل، لذلك لا تحتجز دورات الوكيل البطيئة ACK التسليم الخاص بـ Telegram.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدّد `channels.telegram.mediaMaxMb` (الافتراضي 100) الحد الأقصى لحجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتًا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِدها إذا وصلت أجزاء الألبوم متأخرة؛ وخفّضها لتقليل زمن تأخر الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُضبط، تُطبق القيمة الافتراضية في grammY). تقيّد عملاء البوت القيم المضبوطة التي تقل عن حارس طلبات النص/الكتابة الصادرة البالغ 60 ثانية، حتى لا يوقف grammY تسليم الرد المرئي قبل أن يعمل حارس النقل والبديل في OpenClaw. لا يزال الاستقصاء الطويل يستخدم حارس طلب `getUpdates` لمدة 45 ثانية حتى لا تُترك الاستقصاءات الخاملة إلى أجل غير مسمى.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و `600000` فقط لإعادة تشغيل توقّف الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتؤدي القيمة `0` إلى التعطيل.
    - يُطبّع سياق الرد/الاقتباس/إعادة التوجيه التكميلي في نافذة سياق محادثة واحدة محددة عندما يكون Gateway قد لاحظ الرسائل الأصلية؛ تعيش ذاكرة الرسائل الملحوظة المؤقتة في حالة Plugin الخاصة بـ OpenClaw SQLite، ويستورد `openclaw doctor --fix` الملفات الجانبية القديمة. لا يتضمن Telegram إلا `reply_to_message` سطحية واحدة في التحديثات، لذلك تقتصر السلاسل الأقدم من الذاكرة المؤقتة على حمولة التحديث الحالية من Telegram.
    - تتحكم قوائم السماح في Telegram أساسًا بمن يستطيع تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة إرسال آمنة ومحدودة لفشل ما قبل اتصال Telegram، لكنه لا يعيد محاولة مظاريف الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال في CLI وأداة الرسائل معرّف محادثة رقميًا أو اسم مستخدم أو هدف موضوع منتدى:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    تستخدم استقصاءات Telegram الأمر `openclaw message poll` وتدعم مواضيع المنتديات:

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
    - `--thread-id` لمواضيع المنتديات (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب التسليم المثبّت عندما يستطيع البوت التثبيت في تلك المحادثة
    - `--force-document` لإرسال الصور الصادرة وملفات GIF والفيديوهات كمستندات بدلًا من تحميلات الصور المضغوطة أو الوسائط المتحركة أو الفيديو

    ضبط الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستقصاءات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استقصاءات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في المحادثة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يتفعّل تلقائيًا عند إمكان حل موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    تتحكم `channels.telegram.allowFrom` و `groupAllowFrom` و `defaultTo` بمن يستطيع التحدث إلى البوت وأين يرسل الردود العادية. وهي لا تجعل شخصًا ما موافقًا على التنفيذ. يهيئ أول اقتران رسالة مباشرة معتمد `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذلك يظل إعداد المالك الواحد يعمل من دون تكرار المعرّفات تحت `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في المحادثة؛ لا تفعّل `channel` أو `both` إلا في المجموعات/المواضيع الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة المسبوقة بـ `plugin:` عبر موافقات Plugin؛ وتُحل الأخرى عبر موافقات التنفيذ أولًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ تسليم أو مزود، تتحكم سياسة الأخطاء فيما إذا كانت رسائل الأخطاء تُرسل إلى محادثة Telegram:

| المفتاح                              | القيم                     | الافتراضي       | الوصف                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — أرسل كل رسالة خطأ إلى المحادثة. `once` — أرسل كل رسالة خطأ فريدة مرة واحدة لكل نافذة تهدئة (مع كتم الأخطاء المتطابقة المتكررة). `silent` — لا ترسل رسائل خطأ إلى المحادثة أبدًا. |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | نافذة التهدئة لسياسة `once`. بعد إرسال خطأ، تُكتم رسالة الخطأ نفسها حتى تنقضي هذه الفترة. يمنع ذلك رسائل الأخطاء المزعجة أثناء الانقطاعات.                                      |

تُدعم التجاوزات لكل حساب ولكل مجموعة ولكل موضوع (بنفس الوراثة مثل مفاتيح إعداد Telegram الأخرى).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
  <Accordion title="البوت لا يستجيب لرسائل المجموعة التي لا تحتوي على إشارة">

    - إذا كان `requireMention=false`، يجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزِل البوت من المجموعة وأعد إضافته
    - يحذر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة بلا إشارات.
    - يستطيع `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقًا">

    - عندما يكون `channels.telegram.groups` موجودًا، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - صرّح لهوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - لا يزال تصريح الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - مكالمات بدء التشغيل `deleteMyCommands` / `setMyCommands` ومكالمات الكتابة `sendChatAction` محدودة وتُعاد مرة واحدة عبر بديل نقل Telegram عند انتهاء مهلة الطلب. عادةً ما تشير أخطاء الشبكة/الجلب المستمرة إلى مشكلات وصول DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلغ عن رمز غير مصرح به">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز البوت المضبوط.
    - أعد نسخ رمز البوت أو أنشئه من جديد في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضًا فشل مصادقة؛ ومعاملته كأن "لا يوجد Webhook" لن تؤدي إلا إلى تأجيل فشل الرمز غير الصالح نفسه إلى مكالمات API اللاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/وكيل مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يتسبب خروج IPv6 المعطل في إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء الاستقصاء، يعيد OpenClaw استخدام مسبار `getMe` الناجح عند بدء التشغيل لـ grammY حتى لا يحتاج المشغّل إلى `getMe` ثانية قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء الاستقصاء، يستمر OpenClaw في الاستقصاء الطويل بدلًا من إجراء مكالمة مستوى تحكم أخرى قبل الاستقصاء. يظهر Webhook لا يزال نشطًا كتعارض `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا أُعيد تدوير مقابس Telegram بوتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ تقيّد عملاء البوت القيم المضبوطة التي تقل عن حراس طلبات الصادر و `getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تُجهض كل استقصاء أو رد عندما كانت هذه القيمة مضبوطة أدنى من تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية دون اكتمال حيوية الاستقصاء الطويل افتراضيًا.
    - يحذر `openclaw channels status --probe` و `openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد فترة سماح بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد فترة سماح بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستقصاء قديمًا.
    - زِد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون مكالمات `getUpdates` الطويلة صحية لكن مضيفك لا يزال يبلغ عن إعادة تشغيل توقّف استقصاء إيجابية كاذبة. عادةً ما تشير التوقفات المستمرة إلى مشكلات وكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و `api.telegram.org`.
    - يحترم Telegram أيضًا متغيرات بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و `HTTPS_PROXY` و `ALL_PROXY` ومتغيراتها بأحرف صغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان وكيل OpenClaw المُدار مضبوطًا عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد متغيرات بيئة وكيل قياسية، يستخدم Telegram عنوان URL هذا لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج/TLS مباشر غير مستقر، وجّه مكالمات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيا `autoSelectFamily=true` (باستثناء WSL2). يحترم ترتيب نتائج DNS في Telegram أولا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراضي العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل بشكل أفضل صراحة مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق قياس الأداء RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيا. إذا كان عنوان IP وهمي موثوق أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/ذي استخدام خاص أثناء تنزيلات الوسائط، يمكنك تفعيل
      التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر خيار التفعيل نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان الوكيل لديك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولا. تسمح وسائط Telegram بالفعل بنطاق قياس الأداء
      RFC 2544 افتراضيا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية وسائط Telegram
      من SSRF. استخدمه فقط في بيئات الوكلاء الموثوقة التي يتحكم فيها المشغل
      مثل توجيه IP الوهمي في Clash أو Mihomo أو Surge عندما
      تنشئ إجابات خاصة أو ذات استخدام خاص خارج نطاق قياس الأداء RFC 2544.
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

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ يتم رفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, المستوى الأعلى `bindings[]` (`type: "acp"`)
- افتراضيات المواضيع: ينطبق `groups.<chatId>.topics."*"` على مواضيع المنتدى غير المطابقة؛ وتتجاوزه معرفات المواضيع الدقيقة
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- السلاسل/الردود: `replyToMode`
- البث: `streaming` (معاينة), `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تكوين معرفي حساب أو أكثر، عيّن `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحا. وإلا يعود OpenClaw إلى أول معرف حساب مطبع ويصدر `openclaw doctor` تحذيرا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، ولكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Telegram بـ Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والمواضيع.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والمواضيع بالوكلاء.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
