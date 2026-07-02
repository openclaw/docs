---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم بوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:37:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة مع البوت والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الإقران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وخطط إصلاح.
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
    - معرّف محادثة مجموعة Telegram، المستخدم كمفتاح ضمن `channels.telegram.groups`

    للإعداد لأول مرة، احصل على معرّف محادثة المجموعة من `openclaw logs --follow`، أو بوت معرّفات مُعاد توجيهها، أو Bot API `getUpdates`. بعد السماح للمجموعة، يمكن لـ `/whoami@<bot_username>` تأكيد معرّفات المستخدم والمجموعة.

    معرّفات المجموعات الفائقة السالبة في Telegram التي تبدأ بـ `-100` هي معرّفات محادثات مجموعات. ضعها ضمن `channels.telegram.groups`، وليس ضمن `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتيب حلّ الرمز يراعي الحساب. عمليًا، تتغلب قيم التكوين على بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
بعد بدء تشغيل ناجح، يخزّن OpenClaw هوية البوت مؤقتًا في دليل الحالة لمدة تصل إلى 24 ساعة حتى تتجنب عمليات إعادة التشغيل استدعاء Telegram `getMe` إضافيًا؛ يؤدي تغيير الرمز أو إزالته إلى مسح ذلك التخزين المؤقت.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعات">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، الذي يحدّ من رسائل المجموعات التي تتلقاها.

    إذا كان يجب على البوت رؤية كل رسائل المجموعة، فإما أن:

    - تعطل وضع الخصوصية عبر `/setprivacy`، أو
    - تجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت وأعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة كل رسائل المجموعة، وهذا مفيد لسلوك المجموعة الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather مفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك رؤية المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

### هوية بوت المجموعة

في مجموعات Telegram ومواضيع المنتديات، تُعامل الإشارة الصريحة إلى معرّف البوت المكوّن (مثل `@my_bot`) على أنها توجيه إلى وكيل OpenClaw المحدد، حتى عندما يختلف اسم شخصية الوكيل عن اسم مستخدم Telegram. تظل سياسة صمت المجموعة منطبقة على حركة المجموعة غير ذات الصلة، لكن معرّف البوت نفسه لا يُعد "شخصًا آخر".

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في وصول الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مُرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد اسم مستخدم البوت أو يخمنه أن يوجّه أوامر إلى البوت. استخدمه فقط للبوتات العامة عمدًا مع أدوات مقيّدة بإحكام؛ يجب أن تستخدم البوتات ذات المالك الواحد `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئات `telegram:` / `tg:` وتُطبّع.
    في تكوينات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` العلوي المقيّد كحد أمان: إدخالات `allowFrom: ["*"]` على مستوى الحساب لا تجعل ذلك الحساب عامًا إلا إذا كانت قائمة السماح الفعلية للحساب لا تزال تحتوي على بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة ويرفضه تحقق التكوين.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا أجريت ترقية وكان تكوينك يحتوي على إدخالات قائمة سماح `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الإقران، يمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    للبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول دائمة في التكوين (بدلًا من الاعتماد على موافقات إقران سابقة).

    التباس شائع: الموافقة على إقران الرسائل المباشرة لا تعني "هذا المرسل مخوّل في كل مكان".
    يمنح الإقران وصول الرسائل المباشرة. إذا لم يكن هناك مالك أوامر بعد، يضبط أول إقران موافَق عليه أيضًا `commands.ownerAllowFrom` بحيث يكون للأوامر المخصصة للمالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تخويل مرسل المجموعة يأتي من قوائم السماح الصريحة في التكوين.
    إذا كنت تريد "أنا مخوّل مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ وبالنسبة إلى الأوامر المخصصة للمالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (بلا بوت تابع لطرف ثالث):

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

    1. **المجموعات المسموح بها** (`channels.telegram.groups`)
       - بلا تكوين `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - عند تكوين `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **المرسلون المسموح لهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئات `telegram:` / `tg:`).
    لا تضع معرّفات محادثات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات المحادثات السالبة ضمن `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتخويل المرسلين.
    حد الأمان (`2026.2.25+`): لا يرث تخويل مرسلي المجموعة موافقات مخزن إقران الرسائل المباشرة.
    يبقى الإقران للرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/لكل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى التكوين `allowFrom`، لا إلى مخزن الإقران.
    نمط عملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، يستخدم وقت التشغيل افتراضيًا `groupPolicy="allowlist"` المغلق عند الفشل ما لم يُضبط `channels.defaults.groupPolicy` صراحةً.

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

    اختبره من المجموعة باستخدام `@<bot_username> ping`. لا تؤدي رسائل المجموعة العادية إلى تشغيل البوت أثناء `requireMention: true`.

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
      خطأ شائع: `groupAllowFrom` ليست قائمة سماح لمجموعة Telegram.

      - ضع معرّفات محادثات مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.

    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب ردود المجموعة إشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة `@botusername` أصلية، أو
    - أنماط إشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح أوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    هذه تحدّث حالة الجلسة فقط. استخدم التكوين للاستمرارية.

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

    سياق سجل المجموعة مفعّل دائمًا للمجموعات ومحدود بواسطة
    `historyLimit`. اضبط `channels.telegram.historyLimit: 0` لتعطيل نافذة
    سجل مجموعة Telegram. يُزال المفتاح المتقاعد `includeGroupHistoryContext`
    بواسطة `openclaw doctor --fix`.

    الحصول على معرّف محادثة المجموعة:

    - أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص Bot API `getUpdates`
    - بعد السماح للمجموعة، شغّل `/whoami@<bot_username>` إذا كانت الأوامر الأصلية مفعّلة

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- Telegram مملوك لعملية Gateway.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبَّع الرسائل الواردة إلى غلاف القناة المشترك مع بيانات تعريف الرد، والعناصر النائبة للوسائط، وسياق سلسلة الردود المحفوظ لردود Telegram التي رصدها Gateway.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف موضوعات المنتدى `:topic:<threadId>` لإبقاء الموضوعات معزولة.
- يمكن أن تحمل رسائل DM القيمة `message_thread_id`؛ يحافظ OpenClaw عليها للردود. لا تنقسم جلسات موضوعات DM إلا عندما يبلّغ Telegram `getMe` عن `has_topics_enabled: true` للبوت؛ وإلا تبقى رسائل DM على الجلسة المسطحة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل محادثة/لكل سلسلة. يستخدم تزامن مصرف المشغّل الإجمالي `agents.defaults.maxConcurrent`.
- يحد بدء التشغيل متعدد الحسابات من فحوصات Telegram `getMe` المتزامنة حتى لا توسّع أساطيل البوتات الكبيرة فحص كل حساب دفعة واحدة.
- الاستقصاء الطويل محمي داخل كل عملية Gateway بحيث لا يستطيع استخدام رمز البوت إلا مستقصٍ نشط واحد في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تُفعَّل عمليات إعادة تشغيل مراقب الاستقصاء الطويل بعد 120 ثانية بدون اكتمال حيوية `getUpdates` افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا ظل نشرك يرى عمليات إعادة تشغيل خاطئة بسبب توقف الاستقصاء أثناء أعمال طويلة. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ كما تُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

<Note>
  أُزيلت `channels.telegram.dm.threadReplies` و`channels.telegram.direct.<chatId>.threadReplies`. شغّل `openclaw doctor --fix` بعد الترقية إذا كان إعدادك لا يزال يحتوي على هذه المفاتيح. يتبع توجيه موضوعات DM الآن قدرة البوت من Telegram `getMe.has_topics_enabled`، التي يتحكم بها وضع BotFather ذي السلاسل: تستخدم البوتات الممكّن لها الموضوعات جلسات DM محددة بالسلسلة عندما يرسل Telegram `message_thread_id`؛ وتبقى رسائل DM الأخرى على الجلسة المسطحة.
</Note>

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يستطيع OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - المحادثات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - تُزال اهتزازات معاينات الإجابة الأولية القصيرة، ثم تُنشأ فعليًا بعد تأخير محدود إذا ظل التشغيل نشطًا
    - يحافظ `progress` على مسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويعرض تسمية الحالة المستقرة عندما يصل نشاط الإجابة قبل تقدم الأداة، ويمسحها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` في ما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المعدلة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل أسطر تقدم الأدوات تلك: `raw` (الافتراضي، يحافظ على السلوك المُصدر) أو `status` (تسمية الأداة فقط)
    - يتيح `streaming.progress.commentary` (الافتراضي: `false`) الاشتراك في نص تعليق/تمهيد المساعد في مسودة التقدم المؤقتة
    - تُكتشف `channels.telegram.streamMode` القديمة، وقيم `streaming` المنطقية، ومفاتيح معاينة المسودة الأصلية المتقاعدة؛ شغّل `openclaw doctor --fix` لترحيلها إلى إعداد البث الحالي

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءات الملفات، وتحديثات التخطيط، وملخصات التصحيحات، أو نص تمهيد/تعليق Codex في وضع خادم تطبيق Codex. يبقي Telegram هذه مفعلة افتراضيًا لمطابقة سلوك OpenClaw المُصدر من `v2026.4.22` وما بعده.

    للاحتفاظ بالمعاينة المعدلة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

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

    استخدم وضع `progress` عندما تريد تقدم أدوات مرئيًا بدون تحرير الإجابة النهائية داخل الرسالة نفسها. ضع سياسة نص الأمر تحت `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطَّل تعديلات معاينة Telegram ويُكبت كلام الأدوات/التقدم العام بدلًا من إرساله كرسائل حالة مستقلة. لا تزال مطالبات الموافقة، وحمولات الوسائط، والأخطاء تُوجَّه عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تعديل معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` عرض أسطر الحالة القصيرة لتلك الدورة. لا تزال ردود الرسالة الحالية بدون نص اقتباس محدد تحافظ على بث المعاينة. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأدوات أهم من ردود الاقتباس الأصلية، أو اضبط `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات DM/المجموعات/الموضوعات القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري التحرير النهائي في موضعه
    - النصوص النهائية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الموجودة كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - تمسح النهايات في وضع التقدم مسودة الحالة وتستخدم التسليم النهائي العادي بدلًا من تحرير المسودة إلى الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يُفعَّل بث الكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    سلوك بث الاستدلال:

    - يستخدم `/reasoning stream` مسار معاينة الاستدلال لقناة مدعومة؛ على Telegram، يبث الاستدلال في المعاينة المباشرة أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما ينبغي أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية بدون نص الاستدلال

  </Accordion>

  <Accordion title="تنسيق الرسائل المنسقة">
    يستخدم النص الصادر رسائل Telegram HTML القياسية افتراضيًا حتى تبقى الردود قابلة للقراءة عبر عملاء Telegram الحاليين. يدعم وضع التوافق هذا التنسيق العريض والمائل والروابط والكود والمخفيات والاقتباسات العادية، لكنه لا يدعم الكتل الخاصة بالتنسيق المنسق فقط في Bot API 10.1 مثل الجداول الأصلية، والتفاصيل، والوسائط المنسقة، والصيغ.

    اضبط `channels.telegram.richMessages: true` للاشتراك في رسائل Bot API 10.1 المنسقة:

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

    - يُبلَّغ الوكيل بأن رسائل Telegram المنسقة متاحة لهذا البوت/الحساب.
    - يُعرض نص Markdown عبر Markdown IR الخاص بـ OpenClaw ويُرسل كـ Telegram rich HTML.
    - تحافظ حمولات rich HTML الصريحة على وسوم Bot API 10.1 المدعومة مثل العناوين والجداول والتفاصيل والوسائط المنسقة والصيغ.
    - لا تزال تعليقات الوسائط تستخدم تعليقات Telegram HTML لأن الرسائل المنسقة لا تستبدل التعليقات.

    يبقي هذا نص النموذج بعيدًا عن رموز Telegram Rich Markdown، لذلك لا تُفسَّر العملات مثل `$400-600K` كرياضيات. يُقسَّم النص المنسق الطويل تلقائيًا عبر حدود النص المنسق والكتل المنسقة في Telegram. تُرسل الجداول التي تتجاوز حد الأعمدة في Telegram ككتل كود.

    الافتراضي: متوقف لتوافق العملاء. تتطلب الرسائل المنسقة عملاء Telegram متوافقين؛ يعرض بعض عملاء Desktop وWeb وAndroid والجهات الخارجية الحاليين الرسائل المنسقة المقبولة على أنها غير مدعومة. أبقِ هذا الخيار معطلًا ما لم يكن كل عميل مستخدم مع البوت قادرًا على عرضها. يعرض `/status` ما إذا كانت جلسة Telegram الحالية لديها الرسائل المنسقة مفعلة أم متوقفة.

    معاينات الروابط مفعلة افتراضيًا. يتخطى `channels.telegram.linkPreview: false` اكتشاف الكيانات التلقائي للنص المنسق.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    يُدار تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

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

    - تُطبَّع الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، الطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - تُتخطى التعارضات/التكرارات وتُسجّل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ لا تنفذ السلوك تلقائيًا
    - يمكن أن تظل أوامر Plugin/skill تعمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا عُطّلت الأوامر الأصلية، تُزال الأوامر المدمجة. قد تظل أوامر Plugin/المخصصة تُسجَّل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال متجاوزة للحد بعد التقليص؛ قلّل أوامر Plugin/skill/المخصصة أو عطّل `channels.telegram.commands.native`.
    - يمكن أن يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر Bot API المباشرة عبر curl أن `channels.telegram.apiRoot` ضُبط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء لذلك لا يُبلّغ عن هذا كفشل تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الأجهزة (Plugin `device-pair`)

    عندما يكون Plugin `device-pair` مثبتًا:

    1. ينشئ `/pair` كود إعداد
    2. الصق الكود في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما لا يوجد إلا طلب معلق واحد
       - `/pair approve latest` للأحدث

    يحمل كود الإعداد رمز تمهيد قصير العمر. تمهيد كود الإعداد المدمج خاص بالعقد فقط: ينشئ الاتصال الأول طلب عقدة معلقًا، وبعد الموافقة يعيد Gateway رمز عقدة دائمًا مع `scopes: []`. لا يعيد رمز مشغّل مُسلّمًا؛ يتطلب وصول المشغّل إقران مشغّل منفصلًا معتمدًا أو تدفق رمز.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الاقتران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمّنة">
    اضبط نطاق لوحة المفاتيح المضمّنة:

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

    مثال زر تطبيق مصغّر:

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

    تعمل أزرار Telegram `web_app` فقط في المحادثات الخاصة بين مستخدم
    والروبوت.

    تمرَّر نقرات الاستدعاء التي لا يطالب بها معالج تفاعلي مسجّل في Plugin
    إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تشمل إجراءات أداة Telegram:

    - `sendMessage` (`to`، `content`، اختياريًا `mediaUrl`، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content` أو `caption`، اختياريًا أزرار `presentation` المضمّنة؛ تعدّل التغييرات المقتصرة على الأزرار ترميز الرد)
    - `createForumTopic` (`chatId`، `name`، اختياريًا `iconColor`، `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء بديلة مريحة (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطّل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل منفصلة بصيغة `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال أثناء التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفّذ مسارات الإجراءات إعادة حلّ `SecretRef` مخصّصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل الردود الصريحة في المخرجات المولّدة:

    - `[[reply_to_current]]` يرد على الرسالة التي أطلقت الإجراء
    - `[[reply_to:<id>]]` يرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    عند تمكين تسلسل الردود وتوفّر نص Telegram الأصلي أو التسمية التوضيحية الأصلية، يضمّن OpenClaw مقتطف اقتباس أصلي من Telegram تلقائيًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من بدايتها وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` تسلسل الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتديات وسلوك السلاسل">
    المجموعات الفائقة للمنتديات:

    - تضيف مفاتيح جلسات المواضيع `:topic:<threadId>`
    - تستهدف الردود ومؤشرات الكتابة سلسلة الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - تظل إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات المواضيع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من افتراضيات المجموعة.
    يضبط `topics."*"` افتراضيات كل موضوع في تلك المجموعة؛ وتظل معرّفات المواضيع الدقيقة تغلب على `"*"`.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر ضبط `agentId` في إعدادات الموضوع. يمنح ذلك كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    **ربط موضوع ACP المستمر**: يمكن لمواضيع المنتديات تثبيت جلسات مشغّل ACP عبر روابط ACP typed علوية المستوى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي يقتصر على مواضيع المنتديات في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالسلسلة من المحادثة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (الافتراضي: `true`).

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تتضمن `message_thread_id` ببيانات الرد الوصفية؛ ولا تستخدم مفاتيح جلسات واعية بالسلسلة إلا عندما يبلّغ `getMe` في Telegram عن `has_topics_enabled: true` للروبوت.
    أُحيلت تجاوزات `dm.threadReplies` و`direct.*.threadReplies` السابقة إلى التقاعد عمدًا؛ استخدم وضع السلاسل في BotFather كمصدر وحيد للحقيقة وشغّل `openclaw doctor --fix` لإزالة مفاتيح الإعدادات القديمة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميّز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطَّر نصوص الملاحظات الصوتية الواردة كنص مولّد آليًا
      وغير موثوق في سياق الوكيل؛ ويظل اكتشاف الإشارات يستخدم النص الخام
      حتى تستمر الرسائل الصوتية المقيّدة بالإشارات في العمل.

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

    مثال على إجراء الرسالة:

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

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزّل ويُعالَج (العنصر النائب `<media:sticker>`)
    - TGS متحرك: يُتخطى
    - WEBM فيديو: يُتخطى

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    تُخزَّن أوصاف الملصقات مؤقتًا في حالة Plugin SQLite الخاصة بـ OpenClaw لتقليل استدعاءات الرؤية المتكررة.

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

  <Accordion title="Reaction notifications">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند تفعيلها، يضع OpenClaw أحداث نظام في الطابور مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة التخزين المؤقت للرسائل المرسلة).
    - تظل أحداث التفاعل ملتزمة بضوابط وصول Telegram (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ ويُسقَط المرسلون غير المصرح لهم.
    - لا يوفر Telegram معرّفات السلاسل في تحديثات التفاعل.
      - تُوجَّه المجموعات غير المنتديات إلى جلسة دردشة المجموعة
      - تُوجَّه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` للاستطلاع/الـ Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة. يقرر `ackReactionScope` *متى* يُرسل ذلك الرمز التعبيري فعليًا.

    **ترتيب حل الرمز التعبيري (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رمزًا تعبيريًا unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

    **النطاق (`messages.ackReactionScope`):**

    يقرأ مزود Telegram النطاق من `messages.ackReactionScope` (الافتراضي `"group-mentions"`). لا يوجد اليوم تجاوز على مستوى حساب Telegram أو قناة Telegram.

    القيم: `"all"` (الرسائل المباشرة + المجموعات)، `"direct"` (الرسائل المباشرة فقط)، `"group-all"` (كل رسالة مجموعة، بلا رسائل مباشرة)، `"group-mentions"` (المجموعات عندما يُذكَر البوت؛ **بلا رسائل مباشرة** — هذا هو الافتراضي)، `"off"` / `"none"` (معطل).

    <Note>
    النطاق الافتراضي (`"group-mentions"`) لا يطلق تفاعلات الإقرار في الرسائل المباشرة. للحصول على تفاعل إقرار على رسائل Telegram المباشرة الواردة، اضبط `messages.ackReactionScope` على `"direct"` أو `"all"`. تُقرأ القيمة عند بدء تشغيل مزود Telegram، لذا يلزم إعادة تشغيل Gateway كي يسري التغيير.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    تكون عمليات كتابة إعداد القناة مفعلة افتراضيًا (`configWrites !== false`).

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
    الافتراضي هو الاستطلاع الطويل. لوضع Webhook اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ اختياريًا `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    في وضع الاستطلاع الطويل، يحفظ OpenClaw علامة إعادة التشغيل المائية الخاصة به فقط بعد إرسال تحديث بنجاح. إذا فشل معالج، يبقى ذلك التحديث قابلًا لإعادة المحاولة في العملية نفسها ولا يُكتب كمكتمل لإزالة التكرار عند إعادة التشغيل.

    يربط المستمع المحلي بـ `127.0.0.1:8787`. للدخول العام، إما ضع وكيلًا عكسيًا أمام المنفذ المحلي أو اضبط `webhookHost: "0.0.0.0"` عمدًا.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل دردشة/لكل موضوع المستخدمة في الاستطلاع الطويل، لذلك لا تُبقي دورات الوكيل البطيئة ACK التسليم الخاص بـ Telegram معلّقًا.

  </Accordion>

  <Accordion title="الحدود، وإعادة المحاولة، وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. ارفعه إذا وصلت أجزاء الألبوم متأخرة؛ وخفضه لتقليل زمن استجابة الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يضبط، تنطبق القيمة الافتراضية في grammY). تحد عملاء البوت القيم المضبوطة تحت حارس طلب النص/الكتابة الصادر البالغ 60 ثانية كي لا يوقف grammY تسليم الرد المرئي قبل أن يعمل حارس النقل والاحتياطي في OpenClaw. لا يزال الاستطلاع الطويل يستخدم حارس طلب `getUpdates` لمدة 45 ثانية حتى لا تترك استطلاعات الخمول مهجورة إلى أجل غير مسمى.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و `600000` فقط لإعادة تشغيل توقف الاستطلاع الناتجة عن إنذارات كاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله القيمة `0`.
    - يطبع سياق الرد/الاقتباس/إعادة التوجيه الإضافي في نافذة سياق محادثة محددة واحدة عندما يكون Gateway قد لاحظ الرسائل الأصلية؛ تعيش ذاكرة الرسائل المرصودة المؤقتة في حالة Plugin SQLite الخاصة بـ OpenClaw، ويستورد `openclaw doctor --fix` الملفات الجانبية القديمة. يتضمن Telegram رسالة `reply_to_message` سطحية واحدة فقط في التحديثات، لذلك تقتصر السلاسل الأقدم من الذاكرة المؤقتة على حمولة التحديث الحالية في Telegram.
    - تتحكم قوائم السماح في Telegram أساسا بمن يستطيع تشغيل الوكيل، ولا تشكل حدا كاملا لتنقيح السياق الإضافي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضا إعادة محاولة إرسال آمنة ومحدودة لفشل Telegram قبل الاتصال، لكنه لا يعيد محاولة مغلفات الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال في CLI وأداة الرسائل معرف محادثة رقميا، أو اسم مستخدم، أو هدف موضوع منتدى:

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
    - `--force-document` لإرسال الصور وملفات GIF والفيديوهات الصادرة كمستندات بدلا من تحميلها كصور مضغوطة أو وسائط متحركة أو فيديوهات

    حوكمة الإجراءات:

    - `channels.telegram.actions.sendMessage=false` يعطل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - `channels.telegram.actions.poll=false` يعطل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعلا

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريا نشر المطالبات في المحادثة أو الموضوع الأصلي. يجب أن يكون الموافقون معرفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يتفعل تلقائيا عندما يمكن حل موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    يتحكم `channels.telegram.allowFrom` و `groupAllowFrom` و `defaultTo` في من يستطيع التحدث إلى البوت وأين يرسل الردود العادية. وهي لا تجعل شخصا ما موافق تنفيذ. يهيئ أول اقتران رسائل مباشرة موافق عليه `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذلك يستمر إعداد المالك الواحد في العمل دون تكرار المعرفات ضمن `execApprovals.approvers`.

    يعرض التسليم إلى القناة نص الأمر في المحادثة؛ لا تفعل `channel` أو `both` إلا في المجموعات/المواضيع الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيا.

    تتطلب أزرار الموافقة المضمنة أيضا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح المستهدف (`dm` أو `group` أو `all`). تحل معرفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ وتحل المعرفات الأخرى عبر موافقات التنفيذ أولا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، تتحكم سياسة الأخطاء في ما إذا كانت رسائل الخطأ ترسل إلى محادثة Telegram:

| المفتاح                             | القيم                      | الافتراضي       | الوصف                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — أرسل كل رسالة خطأ إلى المحادثة. `once` — أرسل كل رسالة خطأ فريدة مرة واحدة لكل نافذة تهدئة (مع كبت الأخطاء المتطابقة المتكررة). `silent` — لا ترسل رسائل خطأ إلى المحادثة أبدا. |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | نافذة التهدئة لسياسة `once`. بعد إرسال خطأ، تكبت رسالة الخطأ نفسها حتى ينقضي هذا الفاصل. يمنع إغراق الأخطاء أثناء الانقطاعات.                                      |

تدعم التجاوزات لكل حساب ولكل مجموعة ولكل موضوع (بنمط الوراثة نفسه مثل مفاتيح إعداد Telegram الأخرى).

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
  <Accordion title="البوت لا يرد على رسائل المجموعة غير التي تذكره">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت وأعد إضافته إلى المجموعة
    - يحذر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة دون ذكر.
    - يمكن لـ `openclaw channels status --probe` فحص معرفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص العضوية للبدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقا">

    - عندما يكون `channels.telegram.groups` موجودا، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التجاوز

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيا أو لا تعمل إطلاقا">

    - صرح لهوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - يظل تفويض الأوامر مطبقا حتى عندما تكون سياسة المجموعة `open`
    - فشل `setMyCommands` مع `BOT_COMMANDS_TOO_MUCH` يعني أن القائمة الأصلية فيها إدخالات كثيرة جدا؛ قلل أوامر Plugin/skill/المخصصة أو عطل القوائم الأصلية
    - مكالمات بدء التشغيل `deleteMyCommands` / `setMyCommands` ومكالمات الكتابة `sendChatAction` محدودة وتعيد المحاولة مرة واحدة عبر احتياطي نقل Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادة إلى مشكلات قابلية وصول DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلغ عن رمز غير مصرح به">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز البوت المضبوط.
    - أعد نسخ رمز البوت أو أنشئه من جديد في BotFather، ثم حدث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضا فشل مصادقة؛ ومعاملته كأنه "لا يوجد Webhook" لن تؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى مكالمات API لاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع جلب/وكيل مخصص إلى سلوك إلغاء فوري إذا لم تتطابق أنواع AbortSignal.
    - يحل بعض المضيفين `api.telegram.org` إلى IPv6 أولا؛ ويمكن أن يتسبب خروج IPv6 المعطل في حالات فشل متقطعة لـ Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، يعيد OpenClaw الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستطلاع، يعيد OpenClaw استخدام مسبار `getMe` الناجح عند بدء التشغيل لصالح grammY حتى لا يحتاج المشغل إلى `getMe` ثانية قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستطلاع، ينتقل OpenClaw إلى الاستطلاع الطويل بدلا من إجراء مكالمة مستوى تحكم أخرى قبل الاستطلاع. يظهر Webhook لا يزال نشطا كتعارض `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا كانت مقابس Telegram يعاد تدويرها وفق إيقاع ثابت قصير، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ تحد عملاء البوت القيم المضبوطة تحت حراس الطلب الصادر و `getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تلغي كل استطلاع أو رد عندما تضبط هذه القيمة دون تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية دون اكتمال حيوية الاستطلاع الطويل افتراضيا.
    - يحذر `openclaw channels status --probe` و `openclaw doctor` عندما لا يكون حساب استطلاع عامل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook عامل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستطلاع قديما.
    - لا تزد `channels.telegram.pollingStallThresholdMs` إلا عندما تكون مكالمات `getUpdates` الطويلة صحية لكن مضيفك لا يزال يبلغ عن إعادات تشغيل توقف استطلاع كاذبة. تشير التوقفات المستمرة عادة إلى مشكلات في الوكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و `api.telegram.org`.
    - يحترم Telegram أيضا بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و `HTTPS_PROXY` و `ALL_PROXY` وصيغها ذات الأحرف الصغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا ضبط وكيل OpenClaw المدار عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد بيئة وكيل قياسية، يستخدم Telegram ذلك الرابط لنقل Bot API أيضا.
    - على مضيفي VPS ذوي خروج/TLS مباشر غير مستقر، وجه مكالمات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يعتمد Node 22+ افتراضياً على `autoSelectFamily=true` (باستثناء WSL2). يراعي ترتيب نتائج DNS في Telegram أولاً `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم الافتراضي للعملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ إذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحةً بشكل أفضل بسلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق قياس RFC 2544 (`198.18.0.0/15`) مسموح بها مسبقاً
      لتنزيلات وسائط Telegram افتراضياً. إذا كان fake-IP موثوق أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان خاص/داخلي/ذي استخدام خاص آخر
      أثناء تنزيلات الوسائط، يمكنك الاشتراك في تجاوز مخصص لـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان الوكيل لديك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولاً. تسمح وسائط Telegram مسبقاً بنطاق قياس RFC 2544
      افتراضياً.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية SSRF
      لوسائط Telegram. استخدمه فقط في بيئات الوكلاء الموثوقة التي يتحكم بها المشغل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما
      تنشئ إجابات خاصة أو ذات استخدام خاص خارج نطاق قياس RFC 2544. اتركه معطلاً للوصول العادي إلى Telegram عبر الإنترنت العام.
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

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ يتم رفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` على المستوى الأعلى (`type: "acp"`)
- افتراضيات الموضوع: ينطبق `groups.<chatId>.topics."*"` على موضوعات المنتدى غير المتطابقة؛ وتتجاوزه معرّفات الموضوعات الدقيقة
- موافقات التنفيذ: `execApprovals`، `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- السلاسل/الردود: `replyToMode`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `richMessages`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- جذر API المخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تكوين معرّفي حسابين أو أكثر، عيّن `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحاً. وإلا يعود OpenClaw إلى أول معرّف حساب بعد التطبيع ويصدر `openclaw doctor` تحذيراً. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    أقرن مستخدم Telegram بالـ Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والموضوعات.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
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
