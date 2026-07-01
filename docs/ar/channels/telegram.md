---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم بوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:20:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج للرسائل الخاصة للبوتات والمجموعات عبر grammY. الاستقصاء الطويل هو الوضع الافتراضي؛ وضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة الافتراضية في Telegram هي الإقران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وأدلة إصلاح عملية.
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

  <Step title="كوّن الرمز وسياسة الرسائل الخاصة">

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

  <Step title="ابدأ Gateway ووافق على أول رسالة خاصة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الإقران بعد ساعة واحدة.

  </Step>

  <Step title="أضف البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم احصل على كلا المعرّفين اللذين يحتاجهما وصول المجموعة:

    - معرّف مستخدم Telegram الخاص بك، والمستخدم في `allowFrom` / `groupAllowFrom`
    - معرّف دردشة مجموعة Telegram، والمستخدم كمفتاح ضمن `channels.telegram.groups`

    للإعداد لأول مرة، احصل على معرّف دردشة المجموعة من `openclaw logs --follow`، أو بوت معرّفات مُعاد توجيهها، أو Bot API `getUpdates`. بعد السماح للمجموعة، يمكن لـ `/whoami@<bot_username>` تأكيد معرّفات المستخدم والمجموعة.

    معرّفات مجموعات Telegram الفائقة السالبة التي تبدأ بـ `-100` هي معرّفات دردشة مجموعات. ضعها ضمن `channels.telegram.groups`، وليس ضمن `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتيب حل الرمز مدرك للحساب. عمليًا، تتغلب قيم التكوين على بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
بعد بدء تشغيل ناجح، يخزّن OpenClaw هوية البوت مؤقتًا في دليل الحالة لمدة تصل إلى 24 ساعة بحيث يمكن لعمليات إعادة التشغيل تجنّب استدعاء Telegram `getMe` إضافي؛ يؤدي تغيير الرمز أو إزالته إلى مسح ذلك التخزين المؤقت.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، مما يحد من رسائل المجموعة التي تتلقاها.

    إذا كان يجب أن يرى البوت كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف في إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة كل رسائل المجموعة، وهو أمر مفيد لسلوك المجموعة الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك رؤية المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

### هوية بوت المجموعة

في مجموعات Telegram وموضوعات المنتديات، تُعامل الإشارة الصريحة إلى معرّف البوت المكوّن (مثل `@my_bot`) على أنها توجيه إلى وكيل OpenClaw المحدد، حتى عندما يختلف اسم شخصية الوكيل عن اسم مستخدم Telegram. تظل سياسة صمت المجموعة منطبقة على حركة المجموعة غير ذات الصلة، لكن معرّف البوت نفسه لا يُعد "شخصًا آخر".

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.telegram.dmPolicy` في وصول الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يسمح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يعثر على اسم مستخدم البوت أو يخمنه بأن يأمر البوت. استخدمه فقط للبوتات العامة عمدًا ذات الأدوات المقيدة بإحكام؛ يجب أن تستخدم البوتات ذات المالك الواحد `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئات `telegram:` / `tg:` وتُطبّع.
    في تكوينات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` التقييدي على المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا ظلت قائمة السماح الفعالة للحساب تحتوي على بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل الخاصة ويرفضه تحقق التكوين.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا قمت بالترقية وكان تكوينك يحتوي على إدخالات قائمة سماح `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة سماح مخزن الإقران، يمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    للبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة الوصول دائمة في التكوين (بدلًا من الاعتماد على موافقات إقران سابقة).

    التباس شائع: لا تعني موافقة إقران الرسائل الخاصة أن "هذا المرسل مخول في كل مكان".
    يمنح الإقران وصول الرسائل الخاصة. إذا لم يكن هناك مالك أوامر بعد، يضبط أول إقران معتمد أيضًا `commands.ownerAllowFrom` بحيث يكون لأوامر المالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تخويل مرسلي المجموعات يأتي من قوائم السماح الصريحة في التكوين.
    إذا كنت تريد "أنا مخوّل مرة واحدة وتعمل كل من الرسائل الخاصة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ ولأوامر المالك فقط، تأكد أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (من دون بوت طرف ثالث):

    1. أرسل رسالة خاصة إلى بوتك.
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
       - لا يوجد تكوين `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم تكوين `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **المرسلون المسموح بهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة إلى `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتخويل المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تخويل مرسلي المجموعة موافقات مخزن إقران الرسائل الخاصة.
    يظل الإقران خاصًا بالرسائل الخاصة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/لكل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى تكوين `allowFrom`، وليس مخزن الإقران.
    النمط العملي للبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا تمامًا، فإن وقت التشغيل يعتمد افتراضيًا سياسة إخفاق مغلق `groupPolicy="allowlist"` إلا إذا ضُبط `channels.defaults.groupPolicy` صراحةً.

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

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه حالة الجلسة فقط. استخدم التكوين للاستمرارية.

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
    فقط عندما كانت موجهة إلى البوت، أو كانت ردودًا على البوت،
    أو كانت رسائل البوت نفسه. اضبط `includeGroupHistoryContext: "recent"` من أجل
    تضمين سجل الغرفة الحديث للمجموعات الموثوقة. اضبط
    `includeGroupHistoryContext: "none"` لعدم إرسال أي سجل مجموعة Telegram سابق
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
- تُطبَّع الرسائل الواردة في مظروف القناة المشترك مع بيانات الرد الوصفية، والعناصر النائبة للوسائط، وسياق سلسلة الردود المحفوظ لردود Telegram التي رصدها Gateway.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف موضوعات المنتدى `:topic:<threadId>` لإبقاء الموضوعات معزولة.
- يمكن أن تحمل رسائل DM القيمة `message_thread_id`؛ يحتفظ OpenClaw بها للردود. لا تنقسم جلسات موضوعات DM إلا عندما يبلغ Telegram `getMe` عن `has_topics_enabled: true` للبوت؛ وإلا تبقى رسائل DM على الجلسة المسطحة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل محادثة/كل سلسلة. يستخدم تزامن مصرف المشغّل الإجمالي `agents.defaults.maxConcurrent`.
- يحد بدء التشغيل متعدد الحسابات من فحوصات Telegram `getMe` المتزامنة حتى لا تنشر أساطيل البوتات الكبيرة كل فحص حساب دفعة واحدة.
- الاستقصاء الطويل محمي داخل كل عملية Gateway بحيث لا يمكن إلا لمستطلع نشط واحد استخدام رمز بوت في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw، أو سكربت، أو مستطلع خارجي يستخدم الرمز نفسه.
- تُشغَّل إعادات تشغيل مراقب الاستقصاء الطويل بعد 120 ثانية من دون اكتمال حيوية `getUpdates` افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان النشر لديك لا يزال يرى إعادات تشغيل كاذبة بسبب توقف الاستقصاء أثناء عمل طويل المدة. القيمة بالميلي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا تملك Telegram Bot API دعمًا لإيصالات القراءة (`sendReadReceipts` لا ينطبق).

<Note>
  أُزيلت `channels.telegram.dm.threadReplies` و`channels.telegram.direct.<chatId>.threadReplies`. شغّل `openclaw doctor --fix` بعد الترقية إذا كان الإعداد لديك لا يزال يحتوي على هذه المفاتيح. يتبع توجيه موضوعات DM الآن قدرة البوت من Telegram `getMe.has_topics_enabled`، التي يتحكم بها وضع السلاسل في BotFather: تستخدم البوتات الممكّنة للموضوعات جلسات DM مقيّدة بالسلسلة عندما يرسل Telegram القيمة `message_thread_id`؛ وتبقى رسائل DM الأخرى على الجلسة المسطحة.
</Note>

## مرجع الميزات

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    يستطيع OpenClaw بث الردود الجزئية في الوقت الحقيقي:

    - المحادثات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - تُزال رجفات معاينات الإجابة الأولية القصيرة، ثم تُجسَّد بعد تأخير محدود إذا كان التشغيل لا يزال نشطًا
    - يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويعرض تسمية الحالة المستقرة عندما يصل نشاط الإجابة قبل تقدم الأداة، ويمسحها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` في ما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة المحررة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل أسطر تقدم الأدوات تلك: `raw` (الافتراضي، يحافظ على السلوك المنشور) أو `status` (تسمية الأداة فقط)
    - يفعّل `streaming.progress.commentary` (الافتراضي: `false`) نص تعليق/تمهيد المساعد في مسودة التقدم المؤقتة
    - تُكتشف `channels.telegram.streamMode` القديمة، وقيم `streaming` المنطقية، ومفاتيح معاينة المسودة الأصلية المتقاعدة؛ شغّل `openclaw doctor --fix` لترحيلها إلى إعداد البث الحالي

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة المعروضة أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، وملخصات التصحيحات، أو نص تمهيد/تعليق Codex في وضع خادم تطبيق Codex. يبقي Telegram هذه مفعّلة افتراضيًا لمطابقة سلوك OpenClaw المنشور من `v2026.4.22` وما بعده.

    للاحتفاظ بالمعاينة المحررة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، عيّن:

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

    للاحتفاظ بتقدم الأدوات مرئيًا مع إخفاء نص الأمر/التنفيذ، عيّن:

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

    استخدم وضع `progress` عندما تريد تقدم أدوات مرئيًا من دون تحرير الإجابة النهائية داخل تلك الرسالة نفسها. ضع سياسة نص الأمر ضمن `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطَّل تعديلات معاينة Telegram ويُكبت كلام الأداة/التقدم العام بدلًا من إرساله كرسائل حالة مستقلة. لا تزال مطالبات الموافقة، وحمولات الوسائط، والأخطاء تمر عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تحرير معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` عرض أسطر الحالة القصيرة لتلك الدورة. لا تزال ردود الرسالة الحالية من دون نص اقتباس محدد تحتفظ ببث المعاينة. عيّن `replyToMode: "off"` عندما تكون رؤية تقدم الأدوات أهم من ردود الاقتباس الأصلية، أو عيّن `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات DM/المجموعة/الموضوع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها وينفذ التحرير النهائي في مكانه
    - النهايات النصية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الحالية كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - تمسح نهايات وضع التقدم مسودة الحالة وتستخدم التسليم النهائي العادي بدلًا من تحرير المسودة إلى الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يُفعَّل بث الكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    سلوك بث الاستدلال:

    - يستخدم `/reasoning stream` مسار معاينة الاستدلال لقناة مدعومة؛ على Telegram، يبث الاستدلال في المعاينة الحية أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما يجب أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="Rich message formatting">
    يستخدم النص الصادر رسائل HTML القياسية في Telegram افتراضيًا حتى تبقى الردود قابلة للقراءة عبر عملاء Telegram الحاليين. يدعم وضع التوافق هذا الخط العريض والمائل والروابط والكود والمفسدات والاقتباسات العادية، لكن لا يدعم كتل Bot API 10.1 الحصرية للرسائل الغنية مثل الجداول الأصلية والتفاصيل والوسائط الغنية والصيغ.

    عيّن `channels.telegram.richMessages: true` لتفعيل رسائل Bot API 10.1 الغنية:

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
    - يُصيَّر نص Markdown عبر Markdown IR الخاص بـ OpenClaw ويُرسل كـ HTML غني في Telegram.
    - تحفظ حمولات HTML الغنية الصريحة وسوم Bot API 10.1 المدعومة مثل العناوين والجداول والتفاصيل والوسائط الغنية والصيغ.
    - لا تزال تسميات الوسائط تستخدم تسميات HTML في Telegram لأن الرسائل الغنية لا تستبدل التسميات.

    هذا يبقي نص النموذج بعيدًا عن علامات Telegram Rich Markdown، لذلك لا تُفسَّر عملات مثل `$400-600K` كرياضيات. يُقسَّم النص الغني الطويل تلقائيًا عبر حدود النص الغني والكتل الغنية في Telegram. تُرسل الجداول التي تتجاوز حد الأعمدة في Telegram ككتل كود.

    الافتراضي: معطّل لتوافق العملاء. تتطلب الرسائل الغنية عملاء Telegram متوافقين؛ تعرض بعض عملاء Desktop وWeb وAndroid والعملاء الخارجيين الحاليين الرسائل الغنية المقبولة كغير مدعومة. اترك هذا الخيار معطلًا ما لم يكن كل عميل يُستخدم مع البوت قادرًا على عرضها. يوضح `/status` ما إذا كانت جلسة Telegram الحالية تشغّل الرسائل الغنية أو توقفها.

    معاينات الروابط مفعّلة افتراضيًا. يتخطى `channels.telegram.linkPreview: false` اكتشاف الكيانات التلقائي للنص الغني.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    يُتعامل مع تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    افتراضيات الأوامر الأصلية:

    - يمكّن `commands.native: "auto"` الأوامر الأصلية لـ Telegram

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
    - تُتخطى التعارضات/التكرارات وتُسجَّل في السجل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ لا تنفذ السلوك تلقائيًا
    - يمكن أن تظل أوامر Plugin/Skill تعمل عند كتابتها حتى إذا لم تظهر في قائمة Telegram

    إذا عُطّلت الأوامر الأصلية، تُزال الأوامر المدمجة. قد تظل أوامر Plugin/المخصصة مسجلة إذا كانت معدّة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال تجاوزت الحد بعد التشذيب؛ قلّل أوامر Plugin/Skill/المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API أن `channels.telegram.apiRoot` عُيّن إلى نقطة نهاية `/bot<TOKEN>` الكاملة. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` العرضية.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المعدّ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء لذلك لا يُبلّغ عن هذا كفشل تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin `device-pair`)

    عند تثبيت Plugin `device-pair`:

    1. ينشئ `/pair` كود إعداد
    2. الصق الكود في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما لا يوجد إلا طلب معلق واحد
       - `/pair approve latest` للأحدث

    يحمل كود الإعداد رمز تمهيد قصير العمر. تمهيد كود الإعداد المدمج مخصص للعقد فقط: ينشئ أول اتصال طلب عقدة معلقًا، وبعد الموافقة يعيد Gateway رمز عقدة دائمًا مع `scopes: []`. لا يعيد رمز مشغّل مُسلَّمًا؛ يتطلب وصول المشغّل إقران مشغّل منفصلًا موافقًا عليه أو تدفق رمز.

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
    والبوت.

    نقرات رد الاتصال التي لا يطالب بها معالج تفاعلي مسجّل في plugin
    تُمرَّر إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أدوات Telegram:

    - `sendMessage` (`to`, `content`, اختياري `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` أو `caption`, أزرار `presentation` المضمّنة اختيارية؛ تعديلات الأزرار فقط تحدّث ترميز الرد)
    - `createForumTopic` (`chatId`, `name`, اختياري `iconColor`, `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء مستعارة مريحة (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في البوابة:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطّل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات الإرسال في وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تعيد مسارات الإجراءات حل `SecretRef` بشكل مخصص لكل عملية إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم سلاسل الردود">
    يدعم Telegram وسوم سلاسل ردود صريحة في الخرج المولّد:

    - يرد `[[reply_to_current]]` على الرسالة المشغّلة
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    عند تفعيل سلاسل الردود وتوفر نص Telegram الأصلي أو التعليق، يدرج OpenClaw تلقائيًا مقتطف اقتباس Telegram أصليًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` سلاسل الردود الضمنية. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتديات وسلوك السلاسل">
    المجموعات الفائقة الخاصة بالمنتديات:

    - تضيف مفاتيح جلسات الموضوع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - تظل إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم تُتجاوز (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من افتراضيات المجموعة.
    يضبط `topics."*"` افتراضيات كل موضوع في تلك المجموعة؛ وتظل معرّفات الموضوع الدقيقة تتغلب على `"*"`.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر ضبط `agentId` في إعدادات الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    عندئذ يكون لكل موضوع مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط موضوع ACP دائم**: يمكن لمواضيع المنتديات تثبيت جلسات حاضنة ACP عبر ارتباطات ACP typed على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بموضوع مثل `-1001234567890:topic:42`). النطاق حاليًا مخصص لمواضيع المنتديات في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بسلسلة من المحادثة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (الافتراضي: `true`).

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تتضمن `message_thread_id` ببيانات الرد الوصفية؛ ولا تستخدم مفاتيح جلسات مدركة للسلاسل إلا عندما يبلغ Telegram `getMe` أن `has_topics_enabled: true` للبوت.
    أُحيلت تجاوزات `dm.threadReplies` و`direct.*.threadReplies` السابقة إلى التقاعد عمدًا؛ استخدم وضع السلاسل في BotFather كمصدر حقيقة وحيد وشغّل `openclaw doctor --fix` لإزالة مفاتيح الإعدادات القديمة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية والملفات الصوتية.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطّر نصوص الملاحظات الصوتية الواردة كنص مولّد آليًا
      وغير موثوق في سياق الوكيل؛ يظل اكتشاف الإشارات يستخدم النص الخام
      حتى تستمر رسائل الصوت المقيدة بالإشارات في العمل.

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ يُرسل نص الرسالة المقدّم بشكل منفصل.

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

    تُخزّن أوصاف الملصقات مؤقتًا في حالة Plugin في SQLite ضمن OpenClaw لتقليل استدعاءات الرؤية المتكررة.

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

  <Accordion title="إشعارات التفاعلات">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التفعيل، يضع OpenClaw أحداث نظام في قائمة الانتظار مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة الرسائل المرسلة المؤقتة).
    - تظل أحداث التفاعل ملتزمة بعناصر التحكم في الوصول الخاصة بـ Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ يُسقط المرسلون غير المصرح لهم.
    - لا يوفر Telegram معرّفات السلاسل في تحديثات التفاعل.
      - تُوجّه المجموعات غير المنتدية إلى جلسة دردشة المجموعة
      - تُوجّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي المحدد بدقة

    تتضمن `allowed_updates` للاستقصاء/الـ Webhook قيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة. يحدد `ackReactionScope` *متى* يُرسل ذلك الرمز التعبيري فعليًا.

    **ترتيب حل الرمز التعبيري (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

    **النطاق (`messages.ackReactionScope`):**

    يقرأ مزود Telegram النطاق من `messages.ackReactionScope` (الافتراضي `"group-mentions"`). لا يوجد تجاوز على مستوى حساب Telegram أو قناة Telegram اليوم.

    القيم: `"all"` (الرسائل المباشرة + المجموعات)، `"direct"` (الرسائل المباشرة فقط)، `"group-all"` (كل رسالة مجموعة، بلا رسائل مباشرة)، `"group-mentions"` (المجموعات عندما يُذكر البوت؛ **بلا رسائل مباشرة** — هذا هو الافتراضي)، `"off"` / `"none"` (معطل).

    <Note>
    لا يفعّل النطاق الافتراضي (`"group-mentions"`) تفاعلات الإقرار في الرسائل المباشرة. للحصول على تفاعل إقرار على رسائل Telegram المباشرة الواردة، عيّن `messages.ackReactionScope` إلى `"direct"` أو `"all"`. تُقرأ القيمة عند بدء تشغيل مزود Telegram، لذلك يلزم إعادة تشغيل Gateway حتى يسري التغيير.
    </Note>

  </Accordion>

  <Accordion title="كتابات الإعدادات من أحداث وأوامر Telegram">
    تكون كتابات إعدادات القناة مفعّلة افتراضيًا (`configWrites !== false`).

    تشمل الكتابات المشغّلة بواسطة Telegram:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
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

  <Accordion title="الاستقصاء الطويل مقابل Webhook">
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ اختياريًا `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    في وضع الاستقصاء الطويل، يحفظ OpenClaw علامة إعادة التشغيل المائية الخاصة به فقط بعد نجاح توزيع التحديث. إذا فشل معالج، يبقى ذلك التحديث قابلًا لإعادة المحاولة في العملية نفسها ولا يُكتب كمكتمل لإزالة تكرار إعادة التشغيل.

    يرتبط المستمع المحلي بـ `127.0.0.1:8787`. للدخول العام، إما ضع وكيلًا عكسيًا أمام المنفذ المحلي أو عيّن `webhookHost: "0.0.0.0"` عمدًا.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل دردشة/كل موضوع المستخدمة في الاستقصاء الطويل، لذلك لا تحتجز دورات الوكيل البطيئة ACK التسليم الخاص بـ Telegram.

  </Accordion>

  <Accordion title="الحدود، وإعادة المحاولة، وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدّ `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتًا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِدها إذا وصلت أجزاء الألبوم متأخرة؛ وخفّضها لتقليل زمن تأخر الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُضبط، تُطبّق القيمة الافتراضية في grammY). تضبط عملاء البوت القيم المكوّنة أدنى من حارس طلبات النص/الكتابة الصادرة البالغ 60 ثانية، حتى لا يوقف grammY تسليم الرد المرئي قبل أن يعمل حارس النقل والاحتياط في OpenClaw. ما يزال الاستقصاء الطويل يستخدم حارس طلب `getUpdates` مدته 45 ثانية حتى لا تُترك عمليات الاستقصاء الخاملة بلا نهاية.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و `600000` فقط لإعادة تشغيل توقفات الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ القيمة `0` تعطّله.
    - يُطبّع السياق الإضافي للرد/الاقتباس/إعادة التوجيه في نافذة سياق محادثة مختارة واحدة عندما يكون Gateway قد رصد رسائل الأصل؛ توجد ذاكرة التخزين المؤقت للرسائل المرصودة في حالة Plugin ضمن SQLite في OpenClaw، ويستورد `openclaw doctor --fix` الملفات الجانبية القديمة. لا يتضمن Telegram إلا `reply_to_message` سطحية واحدة في التحديثات، لذلك تقتصر السلاسل الأقدم من ذاكرة التخزين المؤقت على حمولة التحديث الحالية في Telegram.
    - تتحكم قوائم السماح في Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة محدودة للإرسال الآمن لإخفاقات ما قبل الاتصال في Telegram، لكنه لا يعيد محاولة أغلفة الشبكة الملتبسة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال في CLI وأداة الرسائل معرّف دردشة رقميًا، أو اسم مستخدم، أو هدف موضوع منتدى:

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

    أعلام الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتديات (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب التسليم المثبّت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور الصادرة وملفات GIF ومقاطع الفيديو كمستندات بدلًا من تحميلات الصور المضغوطة أو الوسائط المتحركة أو الفيديو

    تقييد الإجراءات:

    - يعطّل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يعطّل `channels.telegram.actions.poll=false` إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يُفعّل تلقائيًا عندما يكون هناك موافق واحد على الأقل قابل للحل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    تتحكم `channels.telegram.allowFrom` و `groupAllowFrom` و `defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. وهي لا تجعل أي شخص موافقًا على exec. يُمهّد أول اقتران رسالة مباشرة معتمد `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذلك ما يزال إعداد المالك الواحد يعمل دون تكرار المعرّفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في الدردشة؛ لا تفعّل `channel` أو `both` إلا في مجموعات/موضوعات موثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ أما غيرها فيُحل عبر موافقات exec أولًا.

    راجع [موافقات exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، تتحكم سياسة الأخطاء فيما إذا كانت رسائل الخطأ تُرسل إلى دردشة Telegram:

| المفتاح                             | القيم                      | الافتراضي      | الوصف                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — أرسل كل رسالة خطأ إلى الدردشة. `once` — أرسل كل رسالة خطأ فريدة مرة واحدة لكل نافذة تهدئة (مع كبت الأخطاء المتكررة المتطابقة). `silent` — لا ترسل رسائل الخطأ إلى الدردشة أبدًا. |
| `channels.telegram.errorCooldownMs` | رقم (مللي ثانية)          | `14400000` (4س) | نافذة التهدئة لسياسة `once`. بعد إرسال خطأ، تُكبت رسالة الخطأ نفسها حتى تنقضي هذه الفترة. يمنع إغراق الأخطاء أثناء الانقطاعات.                                      |

تُدعم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس التوارث مثل مفاتيح إعداد Telegram الأخرى).

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
    - يحذّر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة بلا إشارة.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ لا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقًا">

    - عندما يوجد `channels.telegram.groups`، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - فوّض هوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - ما يزال تفويض الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدًا؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - مكالمات بدء التشغيل `deleteMyCommands` / `setMyCommands` ومكالمات الكتابة `sendChatAction` محدودة وتُعاد محاولتها مرة واحدة عبر احتياط نقل Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادةً إلى مشكلات قابلية الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلّغ عن رمز غير مخوّل">

    - `getMe returned 401` هو فشل مصادقة من Telegram لرمز البوت المكوّن.
    - انسخ رمز البوت مجددًا أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - يُعد `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل فشل مصادقة أيضًا؛ التعامل معه على أنه "لا يوجد Webhook" لن يفعل إلا تأجيل فشل الرمز السيئ نفسه إلى مكالمات API اللاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع جلب/وكيل مخصص إلى سلوك إيقاف فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يسبب خروج IPv6 المعطّل إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستقصاء، يعيد OpenClaw استخدام فحص `getMe` الناجح عند بدء التشغيل لـ grammY حتى لا يحتاج المشغّل إلى `getMe` ثانية قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، يتابع OpenClaw إلى الاستقصاء الطويل بدلًا من إجراء مكالمة مستوى تحكم أخرى قبل الاستقصاء. يظهر Webhook الذي ما يزال نشطًا كتعارض `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا كانت مقابس Telegram تُعاد تدويرها بإيقاع ثابت قصير، فتحقق من قيمة `channels.telegram.timeoutSeconds` المنخفضة؛ تضبط عملاء البوت القيم المكوّنة أدنى من حراس طلبات الصادر و `getUpdates`، لكن الإصدارات الأقدم كان يمكن أن توقف كل استقصاء أو رد عندما تُضبط هذه القيمة أدنى من تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية افتراضيًا دون اكتمال نشاط الاستقصاء الطويل.
    - يحذّر `openclaw channels status --probe` و `openclaw doctor` عندما لا يكون حساب استقصاء جارٍ قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook جارٍ قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط نقل استقصاء ناجح قديمًا.
    - زِد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون مكالمات `getUpdates` طويلة التشغيل سليمة لكن مضيفك ما يزال يبلّغ عن إعادة تشغيل توقف استقصاء إيجابية كاذبة. تشير التوقفات المستمرة عادةً إلى مشكلات وكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و `api.telegram.org`.
    - يراعي Telegram أيضًا متغيرات بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و `HTTPS_PROXY` و `ALL_PROXY` وصيغها بالأحرف الصغيرة. ما يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان وكيل OpenClaw المُدار مكوّنًا عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد متغيرات بيئة وكيل قياسية، يستخدم Telegram ذلك URL لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج/TLS مباشر غير مستقر، وجّه مكالمات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ القيمة الافتراضية `autoSelectFamily=true` (باستثناء WSL2). يلتزم ترتيب نتائج DNS في Telegram بـ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم الإعداد الافتراضي للعملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك هو WSL2 أو يعمل صراحة بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق قياس الأداء RFC 2544 (`198.18.0.0/15`) مسموح بها مسبقًا
      لتنزيلات وسائط Telegram افتراضيًا. إذا كان fake-IP موثوق أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/مخصص للاستخدام الخاص أثناء تنزيلات الوسائط، يمكنك الاشتراك
      في التجاوز المخصص لـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان وكيلك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة متوقفة أولًا. تسمح وسائط Telegram بالفعل بنطاق قياس الأداء
      RFC 2544 افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية
      وسائط Telegram من SSRF. استخدمه فقط في بيئات الوكيل الموثوقة الخاضعة لسيطرة
      المشغل مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تنشئ
      إجابات خاصة أو مخصصة للاستخدام الخاص خارج نطاق قياس الأداء RFC 2544.
      اتركه متوقفًا للوصول العادي إلى Telegram عبر الإنترنت العام.
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

<Accordion title="حقول Telegram عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` على المستوى الأعلى (`type: "acp"`)
- افتراضيات الموضوعات: ينطبق `groups.<chatId>.topics."*"` على موضوعات المنتدى غير المطابقة؛ وتتجاوزها معرّفات الموضوعات الدقيقة
- موافقات التنفيذ: `execApprovals`، `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- الترابط/الردود: `replyToMode`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `richMessages`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند إعداد معرّفي حسابين أو أكثر، عيّن `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا فسيعود OpenClaw إلى أول معرّف حساب مطبّع ويصدر `openclaw doctor` تحذيرًا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكن لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    أقرن مستخدم Telegram بـ Gateway.
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
  <Card title="توجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
