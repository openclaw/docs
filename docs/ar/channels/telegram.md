---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-06-27T17:14:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل bot المباشرة والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الإقران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عابرة للقنوات وأدلة إصلاح عملية.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعداد القناة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز bot في BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد من أن المعرّف هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع المطالبات، واحفظ الرمز.

  </Step>

  <Step title="اضبط الرمز وسياسة الرسائل المباشرة">

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
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز في الإعداد/البيئة، ثم ابدأ Gateway.

  </Step>

  <Step title="ابدأ Gateway واعتمد أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الإقران بعد ساعة واحدة.

  </Step>

  <Step title="أضف bot إلى مجموعة">
    أضف bot إلى مجموعتك، ثم احصل على كلا المعرّفين اللذين يحتاجهما وصول المجموعة:

    - معرّف مستخدم Telegram الخاص بك، المستخدم في `allowFrom` / `groupAllowFrom`
    - معرّف دردشة مجموعة Telegram، المستخدم كمفتاح تحت `channels.telegram.groups`

    في الإعداد لأول مرة، احصل على معرّف دردشة المجموعة من `openclaw logs --follow`، أو bot للمعرّفات المعاد توجيهها، أو `getUpdates` في Bot API. بعد السماح بالمجموعة، يمكن لـ `/whoami@<bot_username>` تأكيد معرّفات المستخدم والمجموعة.

    معرّفات مجموعات Telegram الفائقة السالبة التي تبدأ بـ `-100` هي معرّفات دردشة مجموعات. ضعها تحت `channels.telegram.groups`، وليس تحت `groupAllowFrom`.

  </Step>
</Steps>

<Note>
ترتيب حل الرمز واع بالحساب. عمليًا، تفوز قيم الإعداد على بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
بعد بدء تشغيل ناجح، يخزّن OpenClaw هوية bot مؤقتًا في دليل الحالة لمدة تصل إلى 24 ساعة حتى تتجنب عمليات إعادة التشغيل استدعاء Telegram `getMe` إضافيًا؛ ويؤدي تغيير الرمز أو إزالته إلى مسح هذا التخزين المؤقت.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وظهور المجموعة">
    تكون bots في Telegram افتراضيًا على **وضع الخصوصية**، مما يحد من رسائل المجموعات التي تتلقاها.

    إذا كان يجب أن يرى bot كل رسائل المجموعة، فإما أن:

    - تعطّل وضع الخصوصية عبر `/setprivacy`، أو
    - تجعل bot مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل bot وأعد إضافته في كل مجموعة حتى يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تتحكم إعدادات مجموعة Telegram في حالة المشرف.

    تتلقى bots المشرفة كل رسائل المجموعة، وهذا مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو رفضها
    - `/setprivacy` لسلوك ظهور المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

### هوية bot في المجموعة

في مجموعات Telegram وموضوعات المنتديات، تُعامل الإشارة الصريحة إلى معرّف bot المضبوط (مثل `@my_bot`) على أنها توجيه إلى وكيل OpenClaw المحدد، حتى عندما يختلف اسم شخصية الوكيل عن اسم مستخدم Telegram. تظل سياسة صمت المجموعة منطبقة على حركة المجموعة غير ذات الصلة، لكن معرّف bot نفسه لا يُعد "شخصًا آخر".

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول عبر الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يعثر على اسم مستخدم bot أو يخمنه أن يصدر أوامر إلى bot. استخدمه فقط لـ bots العامة عمدًا ذات الأدوات المقيدة بإحكام؛ يجب أن تستخدم bots ذات المالك الواحد `allowlist` مع معرّفات المستخدمين الرقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئات `telegram:` / `tg:` وتُطبّع.
    في إعدادات متعددة الحسابات، يُعامل `channels.telegram.allowFrom` التقييدي على المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا ظلت قائمة السماح الفعالة للحساب تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة، ويرفضه تحقق الإعداد.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا أجريت ترقية وكان إعدادك يحتوي على إدخالات قائمة سماح `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز bot في Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الإقران، فيمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    بالنسبة إلى bots ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول دائمة في الإعداد (بدلًا من الاعتماد على موافقات إقران سابقة).

    التباس شائع: لا تعني موافقة إقران الرسائل المباشرة أن "هذا المرسل مخوّل في كل مكان".
    يمنح الإقران وصول الرسائل المباشرة. إذا لم يكن هناك مالك أوامر بعد، فإن أول إقران معتمد يضبط أيضًا `commands.ownerAllowFrom` حتى يكون لأوامر المالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    ما يزال تفويض مرسل المجموعة يأتي من قوائم السماح الصريحة في الإعداد.
    إذا كنت تريد "أنا مخوّل مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ وبالنسبة إلى أوامر المالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (من دون bot تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى bot الخاص بك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة طرف ثالث (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعة وقوائم السماح">
    ينطبق عنصران تحكميان معًا:

    1. **المجموعات المسموح بها** (`channels.telegram.groups`)
       - لا يوجد إعداد `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **المرسلون المسموح لهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع البادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة تحت `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث مصادقة مرسل المجموعة موافقات مخزن إقران الرسائل المباشرة.
    يبقى الإقران للرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا كان `groupAllowFrom` غير مضبوط، يعود Telegram إلى إعداد `allowFrom`، وليس مخزن الإقران.
    نمط عملي لـ bots ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة تحت `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فالقيم الافتراضية وقت التشغيل هي الفشل المغلق `groupPolicy="allowlist"` ما لم يُضبط `channels.defaults.groupPolicy` صراحةً.

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

    اختبره من المجموعة باستخدام `@<bot_username> ping`. لا تؤدي رسائل المجموعة العادية إلى تشغيل bot عندما يكون `requireMention: true`.

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
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` تحت `groupAllowFrom` عندما تريد تحديد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل bot.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى bot.

    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب ردود المجموعة إشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية `@botusername`، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح أوامر مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه حالة الجلسة فقط. استخدم الإعداد للاستمرارية.

    مثال إعداد دائم:

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

    يكون سياق تاريخ المجموعة افتراضيًا `mention-only`: تُضمّن رسائل المجموعة السابقة
    فقط عندما تكون موجّهة إلى bot، أو ردودًا على bot،
    أو رسائل bot نفسه. اضبط `includeGroupHistoryContext: "recent"` من أجل
    تضمين سجل الغرفة الأخير للمجموعات الموثوقة. اضبط
    `includeGroupHistoryContext: "none"` لعدم إرسال أي تاريخ سابق لمجموعة Telegram
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
    - أو افحص `getUpdates` في Bot API
    - بعد السماح بالمجموعة، شغّل `/whoami@<bot_username>` إذا كانت الأوامر الأصلية مفعّلة

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يملك Gateway process Telegram.
- التوجيه حتمي: ترد رسائل Telegram الواردة إلى Telegram (النموذج لا يختار القنوات).
- تُطبَّع الرسائل الواردة في غلاف القناة المشترك مع بيانات تعريف الرد، وعناصر نائبة للوسائط، وسياق سلسلة الردود المستمر لردود Telegram التي رصدها Gateway.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف موضوعات المنتدى `:topic:<threadId>` لإبقاء الموضوعات معزولة.
- يمكن لرسائل DM أن تحمل `message_thread_id`؛ يحافظ OpenClaw عليه للردود. لا تُقسَّم جلسات موضوعات DM إلا عندما يُبلغ Telegram `getMe` عن `has_topics_enabled: true` للبوت؛ وإلا تبقى رسائل DM على الجلسة المسطحة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل محادثة/لكل سلسلة. يستخدم تزامن مصرف المشغّل العام `agents.defaults.maxConcurrent`.
- يقيّد بدء التشغيل متعدد الحسابات فحوصات Telegram `getMe` المتزامنة حتى لا تنشر أساطيل البوتات الكبيرة كل فحوصات الحسابات دفعة واحدة.
- الاستقصاء الطويل محمي داخل كل عملية Gateway بحيث لا يستطيع استخدام رمز بوت في وقت واحد إلا مستقصٍ نشط واحد. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تُفعَّل إعادة تشغيل مراقب الاستقصاء الطويل افتراضيًا بعد 120 ثانية من دون اكتمال حيوية `getUpdates`. زِد `channels.telegram.pollingStallThresholdMs` فقط إذا كان النشر لديك لا يزال يرى عمليات إعادة تشغيل كاذبة بسبب توقّف الاستقصاء أثناء أعمال طويلة المدة. القيمة بالميلي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

<Note>
  أُزيل `channels.telegram.dm.threadReplies` و`channels.telegram.direct.<chatId>.threadReplies`. شغّل `openclaw doctor --fix` بعد الترقية إذا كان إعدادك لا يزال يحتوي على هذه المفاتيح. يتبع توجيه موضوعات DM الآن قدرة البوت من Telegram `getMe.has_topics_enabled`، التي يتحكم بها وضع السلاسل في BotFather: تستخدم البوتات المفعّلة للموضوعات جلسات DM محددة بالسلسلة عندما يرسل Telegram `message_thread_id`؛ وتبقى رسائل DM الأخرى على الجلسة المسطحة.
</Note>

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الحقيقي:

    - المحادثات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلبات:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - تُزال ازدواجية معاينات الإجابات الأولية القصيرة، ثم تُجسَّد بعد تأخير محدود إذا كان التشغيل لا يزال نشطًا
    - يُبقي `progress` مسودة حالة واحدة قابلة للتحرير لتقدّم الأدوات، ويعرض تسمية الحالة المستقرة عندما يصل نشاط الإجابة قبل تقدّم الأدوات، ويمسحها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدّم تعيد استخدام رسالة المعاينة المحررة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل أسطر تقدّم الأدوات هذه: `raw` (افتراضيًا، يحافظ على السلوك المنشور) أو `status` (تسمية الأداة فقط)
    - يختار `streaming.progress.commentary` (الافتراضي: `false`) إدخال نص تعليق/مقدمة المساعد في مسودة التقدّم المؤقتة
    - تُكتشف `channels.telegram.streamMode` القديمة، وقيم `streaming` المنطقية، ومفاتيح معاينة المسودة الأصلية المتقاعدة؛ شغّل `openclaw doctor --fix` لترحيلها إلى إعداد البث الحالي

    تحديثات معاينة تقدّم الأدوات هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، وملخصات التصحيحات، أو نص مقدمة/تعليق Codex في وضع خادم تطبيق Codex. يُبقي Telegram هذه مفعّلة افتراضيًا لمطابقة سلوك OpenClaw المنشور من `v2026.4.22` وما بعده.

    للإبقاء على المعاينة المحررة لنص الإجابة مع إخفاء أسطر تقدّم الأدوات، عيّن:

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

    استخدم وضع `progress` عندما تريد تقدّم أدوات مرئيًا من دون تحرير الإجابة النهائية في الرسالة نفسها. ضع سياسة نص الأمر تحت `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: تُعطَّل تعديلات معاينة Telegram ويُكبت حديث الأداة/التقدّم العام بدل إرساله كرسائل حالة مستقلة. لا تزال مطالبات الموافقة وحمولات الوسائط والأخطاء تُوجَّه عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط الإبقاء على تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدّم الأدوات.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدل تحرير معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` عرض أسطر الحالة القصيرة لذلك الدور. لا تزال ردود الرسالة الحالية من دون نص اقتباس محدد تُبقي بث المعاينة. عيّن `replyToMode: "off"` عندما تكون رؤية تقدّم الأدوات أهم من ردود الاقتباس الأصلية، أو عيّن `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات DM/المجموعة/الموضوع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري التحرير النهائي في مكانه
    - النصوص النهائية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الحالية كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - تمسح النهايات في وضع التقدّم مسودة الحالة وتستخدم التسليم النهائي العادي بدل تحرير المسودة لتصبح الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يرجع OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يُمكَّن بث الكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    سلوك بث الاستدلال:

    - يستخدم `/reasoning stream` مسار معاينة الاستدلال لقناة مدعومة؛ على Telegram، يبث الاستدلال داخل المعاينة المباشرة أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما ينبغي أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="تنسيق الرسائل الغني">
    يستخدم النص الصادر رسائل Telegram HTML القياسية افتراضيًا حتى تبقى الردود مقروءة عبر عملاء Telegram الحاليين. يدعم وضع التوافق هذا الخط العريض والمائل والروابط والكود والمفسدات والاقتباسات العادية، لكنه لا يدعم كتل Bot API 10.1 الغنية فقط مثل الجداول الأصلية والتفاصيل والوسائط الغنية والصيغ.

    عيّن `channels.telegram.richMessages: true` لاختيار رسائل Bot API 10.1 الغنية:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    عند التمكين:

    - يُبلَّغ الوكيل بأن رسائل Telegram الغنية متاحة لهذا البوت/الحساب.
    - يُعرض نص Markdown عبر Markdown IR الخاص بـ OpenClaw ويُرسل كـ Telegram HTML غني.
    - تحافظ حمولات HTML الغنية الصريحة على وسوم Bot API 10.1 المدعومة مثل العناوين والجداول والتفاصيل والوسائط الغنية والصيغ.
    - لا تزال تسميات الوسائط تستخدم تسميات Telegram HTML لأن الرسائل الغنية لا تستبدل التسميات.

    يُبقي هذا نص النموذج بعيدًا عن رموز Telegram Rich Markdown، لذلك لا تُحلَّل العملات مثل `$400-600K` كرياضيات. يُقسَّم النص الغني الطويل تلقائيًا عبر حدود النص الغني والكتل الغنية في Telegram. تُرسل الجداول التي تتجاوز حد أعمدة Telegram ككتل كود.

    الافتراضي: متوقف لتوافق العملاء. تتطلب الرسائل الغنية عملاء Telegram متوافقين؛ يعرض بعض عملاء Desktop وWeb وAndroid والعملاء الخارجيين الحاليين الرسائل الغنية المقبولة على أنها غير مدعومة. أبقِ هذا الخيار معطّلًا ما لم يكن كل عميل مستخدم مع البوت قادرًا على عرضها. يعرض `/status` ما إذا كانت الرسائل الغنية مفعّلة أو متوقفة لجلسة Telegram الحالية.

    معاينات الروابط مفعّلة افتراضيًا. يتخطى `channels.telegram.linkPreview: false` اكتشاف الكيانات التلقائي للنص الغني.

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
    - تُتخطى التعارضات/التكرارات وتُسجَّل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ لا تنفذ السلوك تلقائيًا
    - يمكن أن تظل أوامر Plugin/Skill تعمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا عُطِّلت الأوامر الأصلية، تُزال الأوامر المدمجة. قد تظل أوامر مخصصة/Plugin تُسجَّل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال تجاوزت الحد بعد القص؛ قلّل أوامر Plugin/Skill/المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر Bot API المباشرة عبر curl أن `channels.telegram.apiRoot` عُيّن إلى نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` عرضية.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء لذلك لا يُبلَّغ عن هذا كفشل تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (`device-pair` plugin)

    عند تثبيت `device-pair` plugin:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلّقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما لا يوجد إلا طلب معلّق واحد
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز إقلاع قصير العمر. إقلاع رمز الإعداد المدمج خاص بالعقدة فقط: يُنشئ الاتصال الأول طلب عقدة معلّقًا، وبعد الموافقة يعيد Gateway رمز عقدة دائمًا مع `scopes: []`. لا يعيد رمز مشغّل مسلّمًا؛ يتطلب وصول المشغّل إقران مشغّل منفصلًا معتمدًا أو تدفق رمز منفصلًا.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلّق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

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

    مثال على إجراء رسالة:

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

    مثال على زر Mini App:

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

    تُمرَّر نقرات معاودة الاتصال إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram:

    - `sendMessage` (`to`, `content`, و`mediaUrl` اختياري، و`replyToMessageId`، و`messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, و`content` أو `caption`، و`presentation` اختياري للأزرار المضمنة؛ تعديلات الأزرار فقط تحدّث ترميز الرد)
    - `createForumTopic` (`chatId`, `name`, و`iconColor` اختياري، و`iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء مستعارة سهلة الاستخدام (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطّل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات الإرسال وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef ارتجالية لكل عملية إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم ترابط الردود">
    يدعم Telegram وسوم ترابط ردود صريحة في المخرجات المولَّدة:

    - `[[reply_to_current]]` يرد على الرسالة المُشغِّلة
    - `[[reply_to:<id>]]` يرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    عند تمكين ترابط الردود وتوفر نص Telegram الأصلي أو التعليق، يضمّن OpenClaw مقتطف اقتباس Telegram أصليًا تلقائيًا. يحد Telegram نص الاقتباس الأصلي بـ 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` ترابط الردود الضمني. ولا تزال وسوم `[[reply_to_*]]` الصريحة مُحترمة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتديات:

    - تُلحق مفاتيح جلسات الموضوع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - عمليات إرسال الرسائل تحذف `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من افتراضيات المجموعة.
    تضبط `topics."*"` الافتراضيات لكل موضوع في تلك المجموعة؛ ولا تزال معرفات الموضوع الدقيقة لها أولوية على `"*"`.

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

    يصبح لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط موضوع ACP المستمر**: يمكن لموضوعات المنتدى تثبيت جلسات حاضنة ACP عبر ربطات ACP typed من المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"`، و`peer.kind: "group"`، ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي يقتصر على موضوعات المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (الافتراضي: `true`).

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات DM ذات `message_thread_id` ببيانات الرد الوصفية؛ ولا تستخدم مفاتيح جلسات واعية بالسلاسل إلا عندما يبلّغ `getMe` في Telegram عن `has_topics_enabled: true` للبوت.
    تم إيقاف تجاوزات `dm.threadReplies` و`direct.*.threadReplies` السابقة عمدًا؛ استخدم وضع BotFather ذي السلاسل كمصدر الحقيقة الوحيد وشغّل `openclaw doctor --fix` لإزالة مفاتيح الإعدادات القديمة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### رسائل الصوت

    يميّز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطَّر نصوص الملاحظات الصوتية الواردة كنص مولّد آليًا
      وغير موثوق به في سياق الوكيل؛ ولا يزال اكتشاف الإشارة يستخدم النص الخام
      بحيث تستمر رسائل الصوت المقيّدة بالإشارة في العمل.

    مثال على إجراء رسالة:

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويُرسل نص الرسالة المقدّم بشكل منفصل.

    ### الملصقات

    التعامل مع الملصقات الواردة:

    - WEBP ثابت: يُنزّل ويُعالج (عنصر نائب `<media:sticker>`)
    - TGS متحرك: يُتخطى
    - WEBM فيديو: يُتخطى

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    تُخزّن أوصاف الملصقات مؤقتًا في حالة Plugin الخاصة بـ OpenClaw SQLite لتقليل استدعاءات الرؤية المتكررة.

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

    ابحث في الملصقات المخزنة مؤقتًا:

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

    عند تفعيلها، يضع OpenClaw أحداث نظام في قائمة الانتظار مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة تخزين مؤقت للرسائل المرسلة).
    - لا تزال أحداث التفاعل تحترم ضوابط وصول Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)؛ ويُسقط المرسلون غير المصرح لهم.
    - لا يوفر Telegram معرّفات السلاسل في تحديثات التفاعل.
      - تُوجّه المجموعات غير المنتدية إلى جلسة محادثة المجموعة
      - تُوجّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/Webhook قيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة. يحدد `ackReactionScope` *متى* يُرسل ذلك الرمز فعليًا.

    **ترتيب حل الرمز التعبيري (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية Unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

    **النطاق (`messages.ackReactionScope`):**

    يقرأ موفر Telegram النطاق من `messages.ackReactionScope` (الافتراضي `"group-mentions"`). لا يوجد تجاوز على مستوى حساب Telegram أو قناة Telegram اليوم.

    القيم: `"all"` (الرسائل المباشرة + المجموعات)، `"direct"` (الرسائل المباشرة فقط)، `"group-all"` (كل رسالة مجموعة، بلا رسائل مباشرة)، `"group-mentions"` (المجموعات عندما يُذكر البوت؛ **بلا رسائل مباشرة** — هذا هو الافتراضي)، `"off"` / `"none"` (معطل).

    <Note>
    لا يؤدي النطاق الافتراضي (`"group-mentions"`) إلى تشغيل تفاعلات الإقرار في الرسائل المباشرة. للحصول على تفاعل إقرار على رسائل Telegram المباشرة الواردة، اضبط `messages.ackReactionScope` على `"direct"` أو `"all"`. تُقرأ القيمة عند بدء تشغيل موفر Telegram، لذلك يلزم إعادة تشغيل Gateway حتى يسري التغيير.
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    تكون عمليات كتابة إعدادات القناة مفعلة افتراضيًا (`configWrites !== false`).

    تتضمن عمليات الكتابة التي يطلقها Telegram ما يلي:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلبان تفعيل الأوامر)

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
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ والخيارات الاختيارية `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    في وضع الاستقصاء الطويل، يحفظ OpenClaw علامة استئناف التشغيل الخاصة به فقط بعد إرسال التحديث بنجاح. إذا فشل معالج، يبقى ذلك التحديث قابلاً لإعادة المحاولة في العملية نفسها ولا يُكتب كمكتمل لإزالة تكرار إعادة التشغيل.

    يستمع المستمع المحلي على `127.0.0.1:8787`. للإدخال العام، إما أن تضع وكيلًا عكسيًا أمام المنفذ المحلي أو تضبط `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حواجز الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل محادثة/كل موضوع التي يستخدمها الاستقصاء الطويل، لذلك لا تؤخر دورات الوكيل البطيئة إقرار التسليم الخاص بـ Telegram.

  </Accordion>

  <Accordion title="الحدود، إعادة المحاولة، وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدّ `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِده إذا وصلت أجزاء الألبوم متأخرة؛ وخفّضه لتقليل زمن استجابة الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُضبط، تُطبق القيمة الافتراضية في grammY). يقيّد عملاء البوت القيم المضبوطة دون حارس طلب النص/الكتابة الصادر البالغ 60 ثانية حتى لا يوقف grammY تسليم الرد المرئي قبل أن يعمل حارس نقل OpenClaw والبديل. ما زال الاستقصاء الطويل يستخدم حارس طلب `getUpdates` لمدة 45 ثانية حتى لا تُترك عمليات الاستقصاء الخاملة إلى أجل غير محدود.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط عند حدوث عمليات إعادة تشغيل كاذبة بسبب تعطل الاستقصاء.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتؤدي القيمة `0` إلى تعطيله.
    - تتم تسوية سياق الرد/الاقتباس/إعادة التوجيه الإضافي في نافذة سياق محادثة واحدة محددة عندما يكون Gateway قد شاهد الرسائل الأصلية؛ توجد ذاكرة التخزين المؤقت للرسائل المرصودة في حالة Plugin الخاصة بـ OpenClaw SQLite، ويستورد `openclaw doctor --fix` الملفات الجانبية القديمة. لا يتضمن Telegram إلا `reply_to_message` سطحية واحدة في التحديثات، لذا تقتصر السلاسل الأقدم من ذاكرة التخزين المؤقت على حمولة التحديث الحالية في Telegram.
    - تتحكم قوائم السماح في Telegram أساسا بمن يستطيع تشغيل الوكيل، وليست حد تنقيح كامل للسياق الإضافي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضا إعادة محاولة محدودة للإرسال الآمن عند إخفاقات Telegram قبل الاتصال، لكنه لا يعيد محاولة أغلفة الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال في CLI وأداة الرسائل معرّف دردشة رقميا، أو اسم مستخدم، أو هدف موضوع منتدى:

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

    يدعم إرسال Telegram أيضا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF ومقاطع الفيديو الصادرة كمستندات بدلا من رفعها كصور مضغوطة أو وسائط متحركة أو فيديوهات

    ضبط الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعلا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل المباشرة للموافقين، ويمكنه اختياريا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يتفعل تلقائيا عندما يمكن حل موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (افتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    تتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. لا تجعل أي شخص موافق exec. يهيئ أول اقتران رسالة مباشرة معتمد `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذا يظل إعداد المالك الواحد يعمل دون تكرار المعرّفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في الدردشة؛ فعّل `channel` أو `both` فقط في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيا.

    تتطلب أزرار الموافقة المضمنة أيضا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ وتُحل المعرّفات الأخرى عبر موافقات exec أولا.

    راجع [موافقات exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الخطأ

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                          |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى الدردشة. ويكتم `silent` ردود الخطأ بالكامل.                   |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | الحد الأدنى للوقت بين ردود الخطأ إلى الدردشة نفسها. يمنع رسائل الخطأ المتكررة أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس وراثة مفاتيح إعداد Telegram الأخرى).

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
  <Accordion title="البوت لا يرد على رسائل المجموعة التي لا تتضمن إشارة">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع خصوصية Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت من المجموعة وأعد إضافته
    - يحذر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة بلا إشارة.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص عضوية البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقا">

    - عند وجود `channels.telegram.groups`، يجب أن تكون المجموعة مدرجة (أو تضمين `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيا أو لا تعمل إطلاقا">

    - خوّل هوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - يظل تخويل الأوامر مطبقا حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدا؛ قلل أوامر Plugin/Skills/المخصصة أو عطّل القوائم الأصلية
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة وتُعاد محاولة واحدة عبر بديل نقل Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادة إلى مشكلات في إمكانية الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلغ عن رمز غير مصرح به">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز البوت المضبوط.
    - أعد نسخ رمز البوت أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضا فشل مصادقة؛ التعامل معه على أنه "لا يوجد Webhook" لن يفعل إلا تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API اللاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع جلب/وكيل مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولا؛ وقد يسبب خروج IPv6 المعطل إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستقصاء، يعيد OpenClaw استخدام فحص بدء التشغيل الناجح `getMe` لـ grammY حتى لا يحتاج المشغّل إلى `getMe` ثانية قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، يواصل OpenClaw الدخول في الاستقصاء الطويل بدلا من إجراء استدعاء آخر إلى مستوى التحكم قبل الاستقصاء. يظهر Webhook ما زال نشطا كتعارض في `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا كانت مقابس Telegram تُعاد تدويرها بوتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ يقيّد عملاء البوت القيم المضبوطة دون حراس الطلب الصادر و`getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تجهض كل استقصاء أو رد عندما كانت هذه القيمة مضبوطة دون تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية دون اكتمال حيوية الاستقصاء الطويل افتراضيا.
    - يحذر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستقصاء قديما.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة لكن مضيفك ما زال يبلغ عن عمليات إعادة تشغيل كاذبة لتعطل الاستقصاء. تشير حالات التعطل المستمرة عادة إلى مشكلات في الوكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يراعي Telegram أيضا متغيرات بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` وصيغها بالحروف الصغيرة. ما زال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا ضُبط وكيل OpenClaw المدار عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولم تكن هناك متغيرات بيئة وكيل قياسية، يستخدم Telegram ذلك الرابط لنقل Bot API أيضا.
    - على مضيفات VPS ذات خروج/TLS مباشر غير مستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيا `autoSelectFamily=true` (باستثناء WSL2). يحترم ترتيب نتائج DNS في Telegram `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراضي العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ إذا لم ينطبق أي منها، يرجع Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحة بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق الاختبار وفق RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيل وسائط Telegram افتراضيًا. إذا كان fake-IP موثوق أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان
      خاص/داخلي/مخصص للاستخدام الخاص آخر أثناء تنزيل الوسائط، يمكنك الاشتراك
      في تجاوز مخصص لـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان الوكيل لديك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلم الخطر معطّلًا أولًا. وسائط Telegram تسمح بالفعل بنطاق
      الاختبار RFC 2544 افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية SSRF
      لوسائط Telegram. استخدمه فقط في بيئات الوكيل الموثوقة والخاضعة لتحكم المشغل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما
      تولّد إجابات خاصة أو مخصصة للاستخدام الخاص خارج نطاق الاختبار
      RFC 2544. اتركه معطّلًا للوصول العادي إلى Telegram عبر الإنترنت العام.
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

<Accordion title="حقول Telegram عالية الإشارة">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` على المستوى الأعلى (`type: "acp"`)
- افتراضيات المواضيع: ينطبق `groups.<chatId>.topics."*"` على مواضيع المنتدى غير المتطابقة؛ وتتجاوزه معرّفات المواضيع الدقيقة
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- المحادثات المترابطة/الردود: `replyToMode`
- البث: `streaming` (معاينة), `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تُضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تكوين معرّفَي حساب أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يرجع OpenClaw إلى أول معرّف حساب مطبّع ويصدر `openclaw doctor` تحذيرًا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Telegram بـ Gateway.
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
