---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-07-03T13:29:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة والمجموعات الخاصة بالروبوت عبر grammY. الاستطلاع الطويل هو الوضع الافتراضي؛ وضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية لـ Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات وإرشادات إصلاح عبر القنوات.
  </Card>
  <Card title="تكوين Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة تكوين القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز الروبوت في BotFather">
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

    بديل البيئة: `TELEGRAM_BOT_TOKEN=...` (الحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ كوّن الرمز في التكوين/البيئة، ثم ابدأ Gateway.

  </Step>

  <Step title="ابدأ Gateway ووافق على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف الروبوت إلى مجموعة">
    أضف الروبوت إلى مجموعتك، ثم احصل على المعرّفين اللذين يحتاجهما الوصول إلى المجموعة:

    - معرّف مستخدم Telegram الخاص بك، ويُستخدم في `allowFrom` / `groupAllowFrom`
    - معرّف دردشة مجموعة Telegram، ويُستخدم كمفتاح ضمن `channels.telegram.groups`

    للإعداد لأول مرة، احصل على معرّف دردشة المجموعة من `openclaw logs --follow`، أو روبوت معرّفات الرسائل المعاد توجيهها، أو Bot API `getUpdates`. بعد السماح للمجموعة، يمكن لـ `/whoami@<bot_username>` تأكيد معرّفات المستخدم والمجموعة.

    معرّفات مجموعات Telegram الفائقة السالبة التي تبدأ بـ `-100` هي معرّفات دردشة مجموعات. ضعها ضمن `channels.telegram.groups`، وليس ضمن `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتيب حل الرمز واعٍ بالحساب. عمليًا، تتغلب قيم التكوين على بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
بعد بدء تشغيل ناجح، يخزّن OpenClaw هوية الروبوت مؤقتًا في دليل الحالة لمدة تصل إلى 24 ساعة حتى تتجنب عمليات إعادة التشغيل استدعاء Telegram `getMe` إضافيًا؛ يؤدي تغيير الرمز أو إزالته إلى مسح ذاكرة التخزين المؤقت هذه.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وظهور المجموعة">
    تستخدم روبوتات Telegram افتراضيًا **وضع الخصوصية**، الذي يحد من رسائل المجموعة التي تتلقاها.

    إذا كان يجب أن يرى الروبوت كل رسائل المجموعة، فإما أن:

    - تعطّل وضع الخصوصية عبر `/setprivacy`، أو
    - تجعل الروبوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل الروبوت وأعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى الروبوتات المشرفة كل رسائل المجموعة، وهذا مفيد لسلوك المجموعة الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك ظهور المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

### هوية روبوت المجموعة

في مجموعات Telegram ومواضيع المنتديات، تُعامل الإشارة الصريحة إلى معرّف الروبوت المكوّن (مثل `@my_bot`) على أنها توجيه إلى وكيل OpenClaw المحدد، حتى عندما يختلف اسم شخصية الوكيل عن اسم مستخدم Telegram. تظل سياسة صمت المجموعة منطبقة على حركة المجموعة غير ذات الصلة، لكن معرّف الروبوت نفسه لا يُعد "شخصًا آخر".

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول عبر الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد اسم مستخدم الروبوت أو يخمّنه أن يصدر أوامر إلى الروبوت. استخدمه فقط للروبوتات العامة عن قصد مع أدوات مقيدة بإحكام؛ ينبغي للروبوتات ذات المالك الواحد استخدام `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئات `telegram:` / `tg:` وتُطبّع.
    في تكوينات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` المقيّد في المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا ظلت قائمة السماح الفعالة للحساب تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة، ويرفضه التحقق من صحة التكوين.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا أجريت ترقية وكان تكوينك يحتوي على إدخالات قائمة سماح `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز روبوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    للروبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول ثابتة في التكوين (بدلًا من الاعتماد على موافقات اقتران سابقة).

    لبس شائع: لا تعني موافقة اقتران الرسائل المباشرة "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران وصولًا إلى الرسائل المباشرة. إذا لم يوجد مالك أوامر بعد، فإن أول اقتران موافق عليه يعيّن أيضًا `commands.ownerAllowFrom` حتى يكون للأوامر الخاصة بالمالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    لا يزال تخويل مرسل المجموعة يأتي من قوائم السماح الصريحة في التكوين.
    إذا كنت تريد "أنا مخوّل مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ وبالنسبة للأوامر الخاصة بالمالك فقط، تأكد أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (دون روبوت تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى روبوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة جهة خارجية (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعة وقوائم السماح">
    ينطبق عنصران للتحكم معًا:

    1. **المجموعات المسموح بها** (`channels.telegram.groups`)
       - لا يوجد تكوين `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم تكوين `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **المرسلون المسموح لهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    ينبغي أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة إلى `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتخويل المرسل.
    حد أمان (`2026.2.25+`): لا يرث تخويل مرسل المجموعة موافقات مخزن اقتران الرسائل المباشرة.
    يبقى الاقتران للرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/لكل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى تكوين `allowFrom`، وليس مخزن الاقتران.
    نمط عملي للروبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، تعود الإعدادات الافتراضية لوقت التشغيل إلى الإغلاق الآمن `groupPolicy="allowlist"` ما لم يُضبط `channels.defaults.groupPolicy` صراحة.

    إعداد مجموعة مخصصة للمالك فقط:

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

    اختبره من المجموعة باستخدام `@<bot_username> ping`. لا تؤدي رسائل المجموعة العادية إلى تشغيل الروبوت عندما يكون `requireMention: true`.

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

      - ضع معرّفات مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تقييد الأشخاص الذين يمكنهم تشغيل الروبوت داخل مجموعة مسموح بها.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى الروبوت.

    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب ردود المجموعة إشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة `@botusername` الأصلية، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح أوامر مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه حالة الجلسة فقط. استخدم التكوين للاستمرارية.

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

    سياق سجل المجموعة مفعّل دائمًا للمجموعات ومحدود بواسطة
    `historyLimit`. اضبط `channels.telegram.historyLimit: 0` لتعطيل نافذة
    سجل مجموعة Telegram. يزيل `openclaw doctor --fix` المفتاح المتقاعد `includeGroupHistoryContext`.

    الحصول على معرّف دردشة المجموعة:

    - أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص Bot API `getUpdates`
    - بعد السماح للمجموعة، شغّل `/whoami@<bot_username>` إذا كانت الأوامر الأصلية مفعّلة

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- Telegram مملوك لعملية Gateway.
- التوجيه حتمي: ترد رسائل Telegram الواردة إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة داخل مظروف القناة المشترك مع بيانات وصفية للرد، وعناصر نائبة للوسائط، وسياق سلسلة ردود محفوظ لردود Telegram التي رصدها Gateway.
- تُعزل جلسات المجموعات حسب معرف المجموعة. تضيف مواضيع المنتدى `:topic:<threadId>` لإبقاء المواضيع معزولة.
- يمكن أن تحمل رسائل DM القيمة `message_thread_id`؛ ويحافظ OpenClaw عليها للردود. لا تنقسم جلسات مواضيع DM إلا عندما يُبلغ Telegram `getMe` عن `has_topics_enabled: true` للبوت؛ وإلا تبقى رسائل DM على الجلسة المسطحة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل دردشة/لكل خيط. يستخدم تزامن مصرف المشغّل الإجمالي `agents.defaults.maxConcurrent`.
- يحد بدء التشغيل متعدد الحسابات من مجسات Telegram `getMe` المتزامنة حتى لا توسّع أساطيل البوتات الكبيرة مجسات كل الحسابات دفعة واحدة.
- يُحمى الاستقصاء الطويل داخل كل عملية Gateway بحيث لا يستطيع استخدام رمز البوت إلا مستقصٍ نشط واحد في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw، أو سكربت، أو مستقصٍ خارجي يستخدم الرمز نفسه.
- تُفعّل إعادة تشغيل مراقب الاستقصاء الطويل افتراضيًا بعد 120 ثانية دون اكتمال حيوية `getUpdates`. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك لا يزال يرى إعادات تشغيل كاذبة بسبب توقف الاستقصاء أثناء عمل طويل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

<Note>
  أُزيلت `channels.telegram.dm.threadReplies` و`channels.telegram.direct.<chatId>.threadReplies`. شغّل `openclaw doctor --fix` بعد الترقية إذا كان ملف الإعداد لديك لا يزال يحتوي على هذه المفاتيح. يتبع توجيه مواضيع DM الآن قدرة البوت من Telegram `getMe.has_topics_enabled`، التي يتحكم بها وضع الخيوط في BotFather: تستخدم البوتات ذات المواضيع المفعلة جلسات DM محددة بالخيط عندما يرسل Telegram `message_thread_id`؛ أما رسائل DM الأخرى فتبقى على الجلسة المسطحة.
</Note>

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يستطيع OpenClaw بث الردود الجزئية في الوقت الحقيقي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - تُؤجّل معاينات الإجابات الأولية القصيرة، ثم تُجسّد بعد تأخير محدود إذا كان التشغيل لا يزال نشطًا
    - يُبقي `progress` مسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويعرض تسمية الحالة الثابتة عندما يصل نشاط الإجابة قبل تقدم الأداة، ويمسحها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` في ما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة المعدلة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل أسطر تقدم الأداة هذه: `raw` (الافتراضي، يحافظ على السلوك الصادر) أو `status` (تسمية الأداة فقط)
    - يفعّل `streaming.progress.commentary` (الافتراضي: `false`) نص تعليق/تمهيد المساعد في مسودة التقدم المؤقتة
    - تُكتشف `channels.telegram.streamMode` القديمة، وقيم `streaming` المنطقية، ومفاتيح معاينة المسودة الأصلية المتقاعدة؛ شغّل `openclaw doctor --fix` لترحيلها إلى إعداد البث الحالي

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءات الملفات، وتحديثات التخطيط، وملخصات التصحيحات، أو نص تمهيد/تعليق Codex في وضع خادم تطبيق Codex. يُبقي Telegram هذه مفعّلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده.

    لإبقاء المعاينة المعدلة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، اضبط:

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

    لإبقاء تقدم الأدوات مرئيًا مع إخفاء نص الأمر/التنفيذ، اضبط:

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

    استخدم وضع `progress` عندما تريد تقدم أدوات مرئيًا دون تحرير الإجابة النهائية داخل الرسالة نفسها. ضع سياسة نص الأمر تحت `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطّل تعديلات معاينة Telegram ويُكتم حديث الأداة/التقدم العام بدلًا من إرساله كرسائل حالة مستقلة. لا تزال مطالبات الموافقة، وحمولات الوسائط، والأخطاء تُوجّه عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تحرير معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` عرض أسطر الحالة القصيرة لذلك الدور. لا تزال ردود الرسالة الحالية دون نص اقتباس محدد تحافظ على بث المعاينة. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأدوات أهم من ردود الاقتباس الأصلية، أو اضبط `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات DM/المجموعة/الموضوع القصيرة: يحافظ OpenClaw على رسالة المعاينة نفسها وينفذ التحرير النهائي في مكانه
    - النهائيات النصية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الموجودة كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - تمسح نهائيات وضع التقدم مسودة الحالة وتستخدم التسليم النهائي العادي بدلًا من تحرير المسودة إلى الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يُفعّل بث الكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    سلوك بث الاستدلال:

    - يستخدم `/reasoning stream` مسار معاينة الاستدلال لقناة مدعومة؛ على Telegram، يبث الاستدلال داخل المعاينة المباشرة أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما ينبغي أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية دون نص الاستدلال

  </Accordion>

  <Accordion title="تنسيق الرسائل الغني">
    يستخدم النص الصادر رسائل Telegram HTML القياسية افتراضيًا حتى تبقى الردود قابلة للقراءة عبر عملاء Telegram الحاليين. يدعم وضع التوافق هذا التنسيق العادي للخط العريض، والمائل، والروابط، والكود، والمفسدات، والاقتباسات، لكنه لا يدعم كتل Bot API 10.1 الغنية فقط مثل الجداول الأصلية، والتفاصيل، والوسائط الغنية، والصيغ.

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
    - يُعرض نص Markdown عبر Markdown IR الخاص بـ OpenClaw ويُرسل كـ HTML غني في Telegram.
    - تحافظ حمولات HTML الغنية الصريحة على وسوم Bot API 10.1 المدعومة مثل العناوين، والجداول، والتفاصيل، والوسائط الغنية، والصيغ.
    - لا تزال تعليقات الوسائط تستخدم تعليقات Telegram HTML لأن الرسائل الغنية لا تستبدل التعليقات.

    يُبقي هذا نص النموذج بعيدًا عن رموز Telegram Rich Markdown، لذلك لا تُفسّر العملات مثل `$400-600K` كرياضيات. يُقسّم النص الغني الطويل تلقائيًا عبر حدود النص الغني والكتل الغنية في Telegram. تُرسل الجداول التي تتجاوز حد الأعمدة في Telegram ككتل كود.

    الافتراضي: معطل لتوافق العملاء. تتطلب الرسائل الغنية عملاء Telegram متوافقين؛ بعض عملاء Desktop وWeb وAndroid والجهات الخارجية الحاليين يعرضون الرسائل الغنية المقبولة على أنها غير مدعومة. أبقِ هذا الخيار معطلًا ما لم يكن كل عميل مستخدم مع البوت قادرًا على عرضها. يعرض `/status` ما إذا كانت جلسة Telegram الحالية تشغّل الرسائل الغنية أم توقفها.

    معاينات الروابط مفعّلة افتراضيًا. يتخطى `channels.telegram.linkPreview: false` اكتشاف الكيانات التلقائي للنص الغني.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
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
    - تُتخطى التعارضات/التكرارات وتُسجل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن أن تظل أوامر Plugin/المهارة تعمل عند كتابتها حتى إن لم تظهر في قائمة Telegram

    إذا عُطلت الأوامر الأصلية، تُزال الأوامر المضمنة. قد تظل أوامر مخصصة/Plugin تُسجل إذا كانت مُعدة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال تتجاوز الحد بعد التقليم؛ قلّل أوامر Plugin/المهارة/المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API أن `channels.telegram.apiRoot` ضُبط على نقطة نهاية `/bot<TOKEN>` الكاملة. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المُعد. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء، لذلك لا يُبلغ عن هذا كفشل تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الأجهزة (Plugin `device-pair`)

    عند تثبيت Plugin `device-pair`:

    1. ينشئ `/pair` كود إعداد
    2. الصق الكود في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما لا يوجد إلا طلب معلق واحد
       - `/pair approve latest` للأحدث

    يحمل كود الإعداد رمز تمهيد قصير الأجل. يُرجع تمهيد كود الإعداد المضمن رمز عقدة دائمًا مع `scopes: []` إضافة إلى رمز تسليم مشغل محدود للإعداد الموثوق على الهاتف المحمول. يستطيع رمز المشغل هذا قراءة الإعداد الأصلي وقت الإعداد، لكنه لا يمنح نطاقات تعديل الإقران أو `operator.admin`.

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
    - `allowlist` (افتراضي)

    يربط `capabilities: ["inlineButtons"]` القديم إلى `inlineButtons: "all"`.

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

    لا تعمل أزرار Telegram `web_app` إلا في الدردشات الخاصة بين مستخدم
    والبوت.

    نقرات رد الاتصال التي لا يطالب بها معالج تفاعلي مسجل من Plugin
    تُمرر إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram:

    - `sendMessage` (`to`, `content`, `mediaUrl` اختياري، `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` أو `caption`، أزرار `presentation` المضمنة اختيارية؛ تعديلات الأزرار فقط تحدّث ترميز الرد)
    - `createForumTopic` (`chatId`, `name`, `iconColor` اختياري، `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء مستعارة مريحة (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم بالبوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (افتراضي: معطل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات الإرسال في وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef مخصصة لكل عملية إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم ترابط الردود">
    يدعم Telegram وسوم ترابط ردود صريحة في المخرجات المولدة:

    - `[[reply_to_current]]` يرد على الرسالة المحفزة
    - `[[reply_to:<id>]]` يرد على معرف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عند تمكين ترابط الردود وتوفر نص Telegram الأصلي أو التعليق التوضيحي، يضمّن OpenClaw تلقائيًا مقتطف اقتباس Telegram أصليًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطل `off` ترابط الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتدى:

    - تضيف مفاتيح جلسات المواضيع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - تظل إجراءات الكتابة تتضمن `message_thread_id`

    وراثة المواضيع: ترث إدخالات المواضيع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    يكون `agentId` خاصًا بالموضوع فقط ولا يرث من افتراضيات المجموعة.
    يعيّن `topics."*"` الافتراضيات لكل موضوع في تلك المجموعة؛ لا تزال معرفات المواضيع الدقيقة تتفوق على `"*"`.

    **توجيه الوكلاء لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر تعيين `agentId` في إعدادات الموضوع. يمنح ذلك كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    **ربط موضوع ACP الدائم**: يمكن لمواضيع المنتدى تثبيت جلسات حزمة ACP عبر روابط ACP مطبوعة على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"`، و`peer.kind: "group"`، ومعرف مؤهل بالموضوع مثل `-1001234567890:topic:42`). محصور حاليًا بمواضيع المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ تُوجّه المتابعات إليها مباشرة. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (افتراضي: `true`).

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ دردشات الرسائل المباشرة التي تحتوي على `message_thread_id` ببيانات الرد الوصفية؛ ولا تستخدم مفاتيح جلسات واعية بالسلاسل إلا عندما يبلّغ Telegram `getMe` عن `has_topics_enabled: true` للبوت.
    أُلغيت عمدًا تجاوزات `dm.threadReplies` و`direct.*.threadReplies` السابقة؛ استخدم وضع BotFather ذي السلاسل كمصدر الحقيقة الوحيد وشغّل `openclaw doctor --fix` لإزالة مفاتيح الإعدادات القديمة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف الصوت
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطر نصوص الملاحظات الصوتية الواردة كنص مولد آليًا
      وغير موثوق في سياق الوكيل؛ لا يزال اكتشاف الإشارات يستخدم النص الخام
      بحيث تواصل الرسائل الصوتية المقيدة بالإشارة العمل.

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

    التعامل مع الملصقات الواردة:

    - static WEBP: يتم تنزيلها ومعالجتها (العنصر النائب `<media:sticker>`)
    - animated TGS: يتم تخطيها
    - video WEBM: يتم تخطيها

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    تُخزّن أوصاف الملصقات مؤقتًا في حالة Plugin الخاصة بـ OpenClaw SQLite لتقليل استدعاءات الرؤية المتكررة.

    تمكين إجراءات الملصقات:

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

    عند التمكين، يدرج OpenClaw أحداث نظام مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - يعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (أفضل جهد عبر ذاكرة تخزين مؤقت للرسائل المرسلة).
    - تظل أحداث التفاعل ملتزمة بعناصر التحكم في الوصول الخاصة بـ Telegram (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ يتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرّفات السلاسل في تحديثات التفاعل.
      - تُوجّه المجموعات غير المنتدى إلى جلسة محادثة المجموعة
      - تُوجّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستطلاع/Webhook قيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة. يحدد `ackReactionScope` *متى* يُرسل ذلك الرمز فعليًا.

    **ترتيب حل الرمز التعبيري (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رمزًا تعبيريًا Unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

    **النطاق (`messages.ackReactionScope`):**

    يقرأ موفر Telegram النطاق من `messages.ackReactionScope` (الافتراضي `"group-mentions"`). لا يوجد حاليًا تجاوز على مستوى حساب Telegram أو قناة Telegram.

    القيم: `"all"` (الرسائل المباشرة + المجموعات)، `"direct"` (الرسائل المباشرة فقط)، `"group-all"` (كل رسالة في مجموعة، بلا رسائل مباشرة)، `"group-mentions"` (المجموعات عندما يُذكر البوت؛ **بلا رسائل مباشرة** — هذا هو الافتراضي)، `"off"` / `"none"` (معطّل).

    <Note>
    النطاق الافتراضي (`"group-mentions"`) لا يشغّل تفاعلات الإقرار في الرسائل المباشرة. للحصول على تفاعل إقرار على رسائل Telegram المباشرة الواردة، اضبط `messages.ackReactionScope` على `"direct"` أو `"all"`. تُقرأ القيمة عند بدء تشغيل موفر Telegram، لذا يلزم إعادة تشغيل Gateway حتى يسري التغيير.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    تكون عمليات كتابة إعداد القناة مفعّلة افتراضيًا (`configWrites !== false`).

    تشمل عمليات الكتابة التي يطلقها Telegram:

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

  <Accordion title="Long polling vs webhook">
    الافتراضي هو الاستطلاع الطويل. لوضع Webhook، اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ والخيارات الاختيارية `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    في وضع الاستطلاع الطويل، يحفظ OpenClaw علامة موضع إعادة التشغيل الخاصة به فقط بعد إرسال تحديث بنجاح. إذا فشل معالج، يبقى ذلك التحديث قابلًا لإعادة المحاولة في العملية نفسها ولا يُكتب كمكتمل لإزالة تكرار إعادة التشغيل.

    يستمع المستمع المحلي على `127.0.0.1:8787`. للدخول العام، إما أن تضع وكيلًا عكسيًا أمام المنفذ المحلي أو تضبط `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حراس الطلبات، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بصورة غير متزامنة عبر مسارات البوت نفسها لكل محادثة/كل موضوع التي يستخدمها الاستطلاع الطويل، بحيث لا تؤخر جولات الوكيل البطيئة إقرار التسليم الخاص بـ Telegram.

  </Accordion>

  <Accordion title="الحدود، وإعادة المحاولة، وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدّ `channels.telegram.mediaMaxMb` (الافتراضي 100) من حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتًا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِده إذا كانت أجزاء الألبوم تصل متأخرة؛ وأنقصه لتقليل زمن تأخير الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُضبط، فتنطبق القيمة الافتراضية في grammY). تقيّد عملاء البوت القيم المضبوطة تحت حاجز طلب النص/الكتابة الصادر البالغ 60 ثانية حتى لا يوقف grammY تسليم الرد المرئي قبل أن يتمكن حاجز النقل والاحتياطي في OpenClaw من العمل. لا يزال الاستطلاع الطويل يستخدم حاجز طلب `getUpdates` مدته 45 ثانية حتى لا تُترك استطلاعات الخمول بلا نهاية.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و `600000` فقط لحالات إعادة تشغيل توقف الاستطلاع الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله القيمة `0`.
    - يُطبّع سياق الرد/الاقتباس/إعادة التوجيه التكميلي في نافذة سياق محادثة واحدة محددة عندما يكون Gateway قد شاهد الرسائل الأصلية؛ تعيش ذاكرة تخزين الرسائل المرصودة في حالة Plugin الخاصة بـ OpenClaw SQLite، ويستورد `openclaw doctor --fix` الملفات الجانبية القديمة. لا يتضمن Telegram إلا `reply_to_message` سطحية واحدة في التحديثات، لذلك تقتصر السلاسل الأقدم من الذاكرة المؤقتة على حمولة التحديث الحالية في Telegram.
    - تتحكم قوائم السماح في Telegram أساسًا بمن يستطيع تشغيل الوكيل، وليست حدًا كاملًا لحجب السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة إرسال آمنة ومحدودة لإخفاقات ما قبل الاتصال في Telegram، لكنه لا يعيد محاولة أغلفة الشبكة الملتبسة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال في CLI وأداة الرسائل معرّف دردشة رقميًا، أو اسم مستخدم، أو هدف موضوع منتدى:

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

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب التسليم المثبّت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF والفيديوهات الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة أو فيديوهات

    ضبط الإجراءات:

    - يعطّل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يعطّل `channels.telegram.actions.poll=false` إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمين رقمية في Telegram.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يُفعّل تلقائيًا عندما يمكن حل موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (افتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    يتحكم `channels.telegram.allowFrom` و `groupAllowFrom` و `defaultTo` في من يستطيع التحدث إلى البوت وأين يرسل الردود العادية. لكنها لا تجعل شخصًا ما موافقًا على التنفيذ. يُهيئ أول ربط رسالة مباشرة معتمد `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذلك يظل إعداد المالك الواحد يعمل دون تكرار المعرّفات ضمن `execApprovals.approvers`.

    يعرض التسليم إلى القناة نص الأمر في الدردشة؛ لا تفعّل `channel` أو `both` إلا في مجموعات/مواضيع موثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ وتُحل المعرفات الأخرى عبر موافقات التنفيذ أولًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، تتحكم سياسة الأخطاء فيما إذا كانت رسائل الخطأ تُرسل إلى دردشة Telegram:

| المفتاح                             | القيم                      | الافتراضي      | الوصف                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — أرسل كل رسالة خطأ إلى الدردشة. `once` — أرسل كل رسالة خطأ فريدة مرة واحدة لكل نافذة تهدئة (مع كبت الأخطاء المتطابقة المتكررة). `silent` — لا ترسل رسائل الخطأ إلى الدردشة مطلقًا. |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | نافذة التهدئة لسياسة `once`. بعد إرسال خطأ، تُكبت رسالة الخطأ نفسها حتى تنقضي هذه المدة. يمنع ذلك إغراق الأخطاء أثناء الانقطاعات.                                      |

تُدعم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس الوراثة مثل مفاتيح إعداد Telegram الأخرى).

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
  <Accordion title="البوت لا يرد على رسائل المجموعة التي لا تذكره">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت من المجموعة وأعد إضافته
    - يحذّر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة لا تذكر البوت.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقًا">

    - عندما يكون `channels.telegram.groups` موجودًا، يجب أن تكون المجموعة مدرجة (أو أن تتضمن `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المرسل لديك (الربط و/أو `allowFrom` الرقمي)
    - لا يزال تفويض الأوامر ينطبق حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدًا؛ قلل أوامر Plugin/Skill/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة وتُعاد محاولتها مرة واحدة عبر احتياطي النقل في Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادةً إلى مشكلات في إمكانية الوصول إلى DNS/HTTPS نحو `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلّغ عن رمز غير مصرّح به">

    - `getMe returned 401` هو فشل مصادقة في Telegram لرمز البوت المضبوط.
    - أعد نسخ رمز البوت أو أنشئه من جديد في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - يُعد `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل فشل مصادقة أيضًا؛ ومعاملته على أنها "لا يوجد Webhook" لن تؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API لاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع جلب/وكيل مخصص إلى سلوك إجهاض فوري إذا اختلفت أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يتسبب خروج IPv6 المعطّل في إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء الاستطلاع، يعيد OpenClaw استخدام فحص بدء التشغيل الناجح `getMe` لصالح grammY حتى لا يحتاج المشغّل إلى `getMe` ثانٍ قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء الاستطلاع، يواصل OpenClaw الدخول في الاستطلاع الطويل بدل إجراء استدعاء آخر لمستوى التحكم قبل الاستطلاع. يظهر Webhook الذي لا يزال نشطًا كتعارض في `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويحاول تنظيف Webhook مرة أخرى.
    - إذا كانت مقابس Telegram تُعاد تدويرها بوتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ تقيّد عملاء البوت القيم المضبوطة تحت حواجز الطلب الصادر و `getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تجهض كل استطلاع أو رد عند ضبط هذا تحت تلك الحواجز.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية افتراضيًا دون اكتمال حيوية الاستطلاع الطويل.
    - يحذّر `openclaw channels status --probe` و `openclaw doctor` عندما لا يكون حساب استطلاع قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستطلاع قديمًا.
    - لا تزِد `channels.telegram.pollingStallThresholdMs` إلا عندما تكون استدعاءات `getUpdates` طويلة الأمد سليمة لكن مضيفك لا يزال يبلّغ عن إعادات تشغيل توقف استطلاع إيجابية كاذبة. تشير التوقفات المستمرة عادةً إلى مشكلات وكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و `api.telegram.org`.
    - يحترم Telegram أيضًا متغيرات بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و `HTTPS_PROXY` و `ALL_PROXY` وصيغها بالأحرف الصغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا ضُبط الوكيل المُدار من OpenClaw عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولم توجد متغيرات بيئة وكيل قياسية، يستخدم Telegram ذلك العنوان لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج/TLS مباشر غير مستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يعتمد Node 22+ افتراضيا على `autoSelectFamily=true` (باستثناء WSL2). يراعي ترتيب نتائج DNS في Telegram أولا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم الإعداد الافتراضي للعملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان المضيف لديك هو WSL2 أو يعمل صراحة بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق القياس المعياري RFC 2544 ‏(`198.18.0.0/15`) مسموح بها
      بالفعل لتنزيلات وسائط Telegram افتراضيا. إذا أعاد عنوان IP وهمي موثوق أو
      وكيل شفاف كتابة `api.telegram.org` إلى عنوان خاص/داخلي/ذي استخدام خاص آخر
      أثناء تنزيلات الوسائط، يمكنك الاشتراك في التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان الوكيل لديك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولا. تسمح وسائط Telegram بالفعل بنطاق القياس
      المعياري RFC 2544 افتراضيا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حمايات SSRF
      لوسائط Telegram. استخدمه فقط في بيئات الوكيل الموثوقة والخاضعة لتحكم المشغل
      مثل توجيه عناوين IP الوهمية في Clash أو Mihomo أو Surge عندما تنشئ
      إجابات خاصة أو ذات استخدام خاص خارج نطاق القياس المعياري RFC 2544.
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

مزيد من المساعدة: [استكشاف مشكلات القنوات وإصلاحها](/ar/channels/troubleshooting).

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` من المستوى الأعلى (`type: "acp"`)
- الإعدادات الافتراضية للموضوعات: ينطبق `groups.<chatId>.topics."*"` على موضوعات المنتدى غير المطابقة؛ وتتجاوزه معرفات الموضوعات الدقيقة
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- التسلسل/الردود: `replyToMode`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تكوين معرفي حساب أو أكثر، عيّن `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحا. وإلا يعود OpenClaw إلى أول معرف حساب مُطبّع، ويصدر `openclaw doctor` تحذيرا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Telegram بالـ Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والموضوعات.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديدات والتقوية.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
