---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-06T07:44:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08475cd9dd3cf641f482db94a0581e4e382a60be4bd6f3bf3d50b980b0235090
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل البوت الخاصة والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ أما وضع Webhook فهو اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وإرشادات الإصلاح.
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

    بديل البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ كوّن الرمز في التكوين/البيئة، ثم ابدأ Gateway.

  </Step>

  <Step title="ابدأ Gateway واعتمد أول رسالة خاصة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف البوت إلى مجموعة">
    أضف البوت إلى مجموعتك، ثم عيّن `channels.telegram.groups` و`groupPolicy` بما يطابق نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حل الرموز واعٍ بالحساب. عمليًا، تكون قيم التكوين أسبق من بديل البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، وهو يحد من رسائل المجموعة التي تتلقاها.

    إذا كان يجب أن يرى البوت كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى بوتات المشرفين كل رسائل المجموعة، وهو أمر مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح تبديل BotFather المفيدة">

    - `/setjoingroups` للسماح/منع الإضافة إلى المجموعات
    - `/setprivacy` لسلوك رؤية المجموعة

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.telegram.dmPolicy` في الوصول عبر الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يسمح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يعثر على اسم مستخدم البوت أو يخمّنه بإرسال أوامر إلى البوت. استخدمه فقط للبوتات العامة عمدًا ذات الأدوات المقيدة بشدة؛ وينبغي للبوتات ذات المالك الواحد استخدام `allowlist` مع معرّفات مستخدمين رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل بادئتا `telegram:` / `tg:` وتُطبّعان.
    في تكوينات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` التقييدي على المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا كانت قائمة السماح الفعالة للحساب لا تزال تحتوي على بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل الخاصة ويرفضه التحقق من صحة التكوين.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا قمت بالترقية وكان تكوينك يحتوي على إدخالات قائمة سماح من نوع `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في مسارات قائمة السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    بالنسبة للبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على متانة سياسة الوصول في التكوين (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    التباس شائع: لا تعني موافقة اقتران الرسائل الخاصة أن "هذا المرسل مخول في كل مكان".
    يمنح الاقتران وصول الرسائل الخاصة. إذا لم يكن هناك مالك أوامر بعد، فإن أول اقتران معتمد يعيّن أيضًا `commands.ownerAllowFrom` حتى تكون للأوامر الخاصة بالمالك وموافقات exec حساب مشغّل صريح.
    لا يزال تفويض مرسلي المجموعات يأتي من قوائم السماح الصريحة في التكوين.
    إذا كنت تريد "أنا مخول مرة واحدة وتعمل كل من الرسائل الخاصة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي لديك في `channels.telegram.allowFrom`؛ وللأوامر الخاصة بالمالك، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram لديك

    أكثر أمانًا (من دون بوت تابع لطرف ثالث):

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
       - تم تكوين `groups`: يعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **المرسلون المسموح بهم في المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُعيّن، يرجع Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع بادئتا `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة إلى `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسل المجموعة موافقات مخزن اقتران الرسائل الخاصة.
    يبقى الاقتران خاصًا بالرسائل الخاصة فقط. للمجموعات، عيّن `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يُعيّن `groupAllowFrom`، يرجع Telegram إلى `allowFrom` في التكوين، وليس مخزن الاقتران.
    النمط العملي للبوتات ذات المالك الواحد: عيّن معرّف المستخدم لديك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير معيّن، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا تمامًا، فسيكون الإعداد الافتراضي وقت التشغيل هو الفشل المغلق `groupPolicy="allowlist"` ما لم يُعيّن `channels.defaults.groupPolicy` صراحة.

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
      خطأ شائع: `groupAllowFrom` ليس قائمة سماح لمجموعات Telegram.

      - ضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
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

    الحصول على معرّف دردشة المجموعة:

    - وجّه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص `getUpdates` في Bot API

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يملك Gateway عملية Telegram.
- التوجيه حتمي: ترد رسائل Telegram الواردة إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى مظروف القناة المشترك مع بيانات الرد الوصفية وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعة حسب معرّف المجموعة. تضيف مواضيع المنتدى `:topic:<threadId>` للحفاظ على عزل المواضيع.
- يمكن أن تحمل رسائل الرسائل الخاصة `message_thread_id`؛ يحافظ OpenClaw على معرّف السلسلة للردود لكنه يبقي الرسائل الخاصة على الجلسة المسطحة افتراضيًا. كوّن `channels.telegram.dm.threadReplies: "inbound"` أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"` أو `requireTopic: true` أو تكوين موضوع مطابق عندما تريد عمدًا عزل جلسات مواضيع الرسائل الخاصة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل دردشة/سلسلة. يستخدم تزامن مصرف المشغّل العام `agents.defaults.maxConcurrent`.
- الاستقصاء الطويل محمي داخل كل عملية Gateway بحيث يمكن لمستقصٍ نشط واحد فقط استخدام رمز بوت في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تُشغّل عمليات إعادة تشغيل مراقب الاستقصاء الطويل افتراضيًا بعد 120 ثانية من دون اكتمال مؤشرات حياة `getUpdates`. زِد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك لا يزال يرى عمليات إعادة تشغيل خاطئة بسبب توقف الاستقصاء أثناء الأعمال طويلة التشغيل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث ردود جزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير لتقدم الأدوات، ويمسحها عند الاكتمال، ويرسل الإجابة النهائية كرسالة عادية
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المحررة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأوامر/exec داخل أسطر تقدم الأدوات تلك: `raw` (افتراضي، يحافظ على السلوك الصادر) أو `status` (تسمية الأداة فقط)
    - تُكتشف قيم `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءة الملفات، وتحديثات التخطيط، أو ملخصات التصحيحات. يبقي Telegram هذه مفعلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده. للاحتفاظ بالمعاينة المحررة لنص الإجابة مع إخفاء أسطر تقدم الأدوات، عيّن:

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

    لإبقاء تقدم الأدوات مرئيًا مع إخفاء نص الأوامر/exec، عيّن:

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

    استخدم وضع `progress` عندما تريد إظهار تقدّم الأدوات دون تحرير الإجابة النهائية داخل الرسالة نفسها. ضع سياسة نص الأمر تحت `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد التسليم النهائي فقط: تُعطَّل تعديلات معاينة Telegram ويُكتم حديث الأدوات/التقدّم العام بدلًا من إرساله كرسائل حالة مستقلة. تظل مطالبات الموافقة، وحمولات الوسائط، والأخطاء تمر عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدّم الأدوات.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تحرير معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` إظهار أسطر الحالة القصيرة لذلك الدور. لا تزال الردود على الرسالة الحالية دون نص اقتباس محدد تحتفظ ببث المعاينة. عيّن `replyToMode: "off"` عندما تكون رؤية تقدّم الأدوات أهم من ردود الاقتباس الأصلية، أو عيّن `streaming.preview.toolProgress: false` للإقرار بهذه المفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات الرسائل الخاصة/المجموعات/المواضيع القصيرة: يُبقي OpenClaw رسالة المعاينة نفسها وينفذ التحرير النهائي في مكانه
    - النصوص النهائية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الحالية كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - النصوص النهائية في وضع التقدّم تمسح مسودة الحالة وتستخدم التسليم النهائي العادي بدلًا من تحرير المسودة لتصبح الإجابة
    - إذا فشل التحرير النهائي قبل تأكيد النص المكتمل، يستخدم OpenClaw التسليم النهائي العادي وينظف المعاينة القديمة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يُفعّل بث الكتل صراحةً في Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    بث التفكير الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` التفكير إلى المعاينة المباشرة أثناء التوليد
    - تُحذف معاينة التفكير بعد التسليم النهائي؛ استخدم `/reasoning on` عندما يجب أن يظل التفكير مرئيًا
    - تُرسل الإجابة النهائية دون نص التفكير

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    يستخدم النص الصادر `parse_mode: "HTML"` في Telegram.

    - يُعرض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - يُهرّب HTML الخام الصادر من النموذج لتقليل إخفاقات تحليل Telegram.
    - إذا رفض Telegram HTML المحلّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    تُعالَج عملية تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    افتراضات الأوامر الأصلية:

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
    - تُتخطى التعارضات/التكرارات وتُسجّل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن لأوامر plugin/skill أن تعمل عند كتابتها حتى إذا لم تظهر في قائمة Telegram

    إذا كانت الأوامر الأصلية معطلة، تُزال الأوامر المضمنة. قد تظل أوامر custom/plugin تسجَّل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما زالت متجاوزة الحد بعد التشذيب؛ قلّل أوامر plugin/skill/custom أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر Bot API المباشرة عبر curl أن `channels.telegram.apiRoot` ضُبط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` هو جذر Bot API فقط، ويزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` العرضية.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستطلاع، لذلك لا يُبلّغ عن ذلك كفشل في تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (Plugin `device-pair`)

    عندما يكون Plugin `device-pair` مثبتًا:

    1. ينشئ `/pair` رمز الإعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. يُبقي تسليم التمهيد المضمن رمز العقدة الأساسية عند `scopes: []`؛ ويبقى أي رمز مشغّل مسلّم محدودًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق التمهيد مسبوقة بالدور، لذلك لا تلبّي قائمة السماح الخاصة بالمشغّل إلا طلبات المشغّل؛ ولا تزال الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الإقران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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
    - `allowlist` (افتراضي)

    تُعيَّن الصيغة القديمة `capabilities: ["inlineButtons"]` إلى `inlineButtons: "all"`.

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

    تُمرَّر نقرات الاستدعاء إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    تتضمن إجراءات أداة Telegram:

    - `sendMessage` (`to`، `content`، اختياري `mediaUrl`، `replyToMessageId`، `messageThreadId`)
    - `react` (`chatId`، `messageId`، `emoji`)
    - `deleteMessage` (`chatId`، `messageId`)
    - `editMessage` (`chatId`، `messageId`، `content`)
    - `createForumTopic` (`chatId`، `name`، اختياري `iconColor`، `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء مستعارة مريحة (`send`، `react`، `delete`، `edit`، `sticker`، `sticker-search`، `topic-create`).

    عناصر التحكم في البوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (افتراضي: معطل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل منفصلة `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل لقطة الإعدادات/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    يدعم Telegram وسوم سلاسل الرد الصريحة في المخرجات المولدة:

    - يرد `[[reply_to_current]]` على الرسالة التي أطلقت الإجراء
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عندما تكون سلاسل الرد مفعلة ويكون نص Telegram الأصلي أو التعليق متاحًا، يضمّن OpenClaw مقتطف اقتباس أصليًا من Telegram تلقائيًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من بدايتها وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` سلاسل الرد الضمنية. لا تزال وسوم `[[reply_to_*]]` الصريحة تُحترم.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    مجموعات المنتدى الفائقة:

    - تضيف مفاتيح جلسة الموضوع `:topic:<threadId>`
    - تستهدف الردود ومؤشرات الكتابة سلسلة الموضوع
    - مسار إعدادات الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، `allowFrom`، `skills`، `systemPrompt`، `enabled`، `groupPolicy`).
    `agentId` خاص بالموضوع ولا يرث من افتراضات المجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عن طريق تعيين `agentId` في إعدادات الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    **ربط موضوع ACP مستمر**: يمكن لمواضيع المنتدى تثبيت جلسات عدة ACP عبر ارتباطات ACP الم typed على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي محصور في مواضيع المنتدى داخل المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجّه المتابعات إليها مباشرةً. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (افتراضي: `true`).

    يكشف سياق القالب `MessageThreadId` و`IsForum`. تحتفظ دردشات الرسائل المباشرة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة وبيانات الرد الوصفية في الجلسات المسطحة افتراضيا؛ ولا تستخدم مفاتيح جلسات واعية بالسلاسل إلا عند تكوينها باستخدام `threadReplies: "inbound"` أو `threadReplies: "always"` أو `requireTopic: true` أو تكوين موضوع مطابق. استخدم `channels.telegram.dm.threadReplies` في المستوى الأعلى كافتراضي للحساب، أو `direct.<chatId>.threadReplies` لرسالة مباشرة واحدة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - يتم تأطير نصوص الملاحظات الصوتية الواردة كنص مولد آليا
      وغير موثوق في سياق الوكيل؛ ولا يزال اكتشاف الإشارات يستخدم النص الخام
      حتى تواصل الرسائل الصوتية المقيدة بالإشارات العمل.

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويتم إرسال نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يتم تنزيله ومعالجته (العنصر النائب `<media:sticker>`)
    - TGS متحرك: يتم تخطيه
    - WEBM فيديو: يتم تخطيه

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة التخزين المؤقت للملصقات:

    - `~/.openclaw/telegram/sticker-cache.json`

    يتم وصف الملصقات مرة واحدة (عند الإمكان) وتخزينها مؤقتا لتقليل استدعاءات الرؤية المتكررة.

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

    عند تفعيلها، يضيف OpenClaw أحداث نظام مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    التكوين:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة تخزين مؤقت للرسائل المرسلة).
    - تظل أحداث التفاعل تراعي عناصر التحكم في وصول Telegram (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ ويتم إسقاط المرسلين غير المصرح لهم.
    - لا يوفر Telegram معرفات السلاسل في تحديثات التفاعل.
      - توجه المجموعات غير المنتديات إلى جلسة دردشة المجموعة
      - توجه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/Webhook `message_reaction` تلقائيا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزا تعبيريا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رمزا تعبيريا unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات التكوين من أحداث وأوامر Telegram">
    تكون كتابات تكوين القناة مفعلة افتراضيا (`configWrites !== false`).

    تشمل الكتابات التي يشغلها Telegram:

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
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook، اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ والخيارات الاختيارية `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    في وضع الاستقصاء الطويل، يحتفظ OpenClaw بعلامة إعادة التشغيل المائية الخاصة به فقط بعد نجاح إرسال التحديث. إذا فشل معالج، يظل ذلك التحديث قابلا لإعادة المحاولة في العملية نفسها ولا يكتب كمكتمل لإزالة تكرار إعادة التشغيل.

    يستمع المستمع المحلي على `127.0.0.1:8787`. للدخول العام، ضع إما وكيلا عكسيا أمام المنفذ المحلي أو اضبط `webhookHost: "0.0.0.0"` عمدا.

    يتحقق وضع Webhook من حراس الطلب، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر المسارات نفسها لكل دردشة/لكل موضوع التي يستخدمها الاستقصاء الطويل، لذلك لا تجعل دورات الوكيل البطيئة إقرار التسليم الخاص بTelegram ينتظر.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدد `channels.telegram.mediaMaxMb` (الافتراضي 100) الحد الأقصى لحجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زدها إذا وصلت أجزاء الألبوم متأخرة؛ وأنقصها لتقليل زمن استجابة الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يضبط، ينطبق افتراضي grammY). تقيد عملاء البوت القيم المكونة التي تقل عن حارس طلب النص/الكتابة الصادر البالغ 60 ثانية حتى لا يجهض grammY تسليم الرد المرئي قبل أن يعمل حارس نقل OpenClaw والبديل. لا يزال الاستقصاء الطويل يستخدم حارس طلب `getUpdates` مدته 45 ثانية حتى لا تترك الاستقصاءات الخاملة إلى أجل غير مسمى.
    - تكون القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله القيمة `0`.
    - يتم حاليا تمرير السياق التكميلي للرد/الاقتباس/إعادة التوجيه كما تم استلامه.
    - تتحكم قوائم السماح في Telegram أساسا في من يمكنه تشغيل الوكيل، وليست حد تنقيح كامل للسياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق تكوين `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضا إعادة محاولة محدودة للإرسال الآمن لإخفاقات Telegram قبل الاتصال، لكنه لا يعيد محاولة أغلفة الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال عبر CLI وأداة الرسائل معرف دردشة رقميا أو اسم مستخدم أو هدف موضوع منتدى:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    تستخدم استطلاعات Telegram `openclaw message poll` وتدعم موضوعات المنتديات:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    أعلام الاستطلاع الخاصة بTelegram فقط:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتديات (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب التسليم المثبت عندما يستطيع البوت التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وGIFs الصادرة كمستندات بدلا من تحميلات صور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يعطل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يعطل `channels.telegram.actions.poll=false` إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعلا

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون الموافقون معرفات مستخدمي Telegram رقمية.

    مسار التكوين:

    - `channels.telegram.execApprovals.enabled` (يتفعل تلقائيا عندما يكون هناك موافق واحد قابل للحل على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`، `sessionFilter`

    تتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. وهي لا تجعل شخصا ما موافق تنفيذ. يقوم أول اقتران رسائل مباشرة موافق عليه بتمهيد `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذلك يظل إعداد المالك الواحد يعمل دون تكرار المعرفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في الدردشة؛ لا تفعل `channel` أو `both` إلا في مجموعات/موضوعات موثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيا.

    تتطلب أزرار الموافقة المضمنة أيضا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). يتم حل معرفات الموافقة المسبوقة بـ `plugin:` عبر موافقات Plugin؛ ويتم حل غيرها عبر موافقات التنفيذ أولا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزود، يمكن لTelegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا تكوين في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                           |
| ----------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى الدردشة. ويكتم `silent` ردود الأخطاء بالكامل.                  |
| `channels.telegram.errorCooldownMs` | رقم (ms)          | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى الدردشة نفسها. يمنع فيضان الأخطاء أثناء الانقطاعات.     |

تدعم التجاوزات لكل حساب ولكل مجموعة ولكل موضوع (نفس الوراثة مثل مفاتيح تكوين Telegram الأخرى).

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
  <Accordion title="لا يستجيب البوت لرسائل المجموعة التي لا تحتوي على إشارة">

    - إذا كان `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت من المجموعة وأعد إضافته
    - يحذر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعات غير مذكور فيها البوت.
    - يمكن لـ `openclaw channels status --probe` فحص معرفات المجموعات الرقمية الصريحة؛ لا يمكن فحص العضوية باستخدام حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقا">

    - عند وجود `channels.telegram.groups`، يجب أن تكون المجموعة مدرجة (أو تتضمن `"*"`)
    - تحقق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيا أو لا تعمل إطلاقا">

    - صرح بهوية المرسل الخاصة بك (الاقتران و/أو `allowFrom` الرقمية)
    - يظل تفويض الأوامر مطبقا حتى عندما تكون سياسة المجموعة `open`
    - تعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدا؛ قلل أوامر Plugin/Skills/الأوامر المخصصة أو عطل القوائم الأصلية
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة وتعيد المحاولة مرة واحدة عبر احتياطي نقل Telegram عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادة إلى مشكلات وصول DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلغ عن رمز غير مصرح به">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز البوت المكون.
    - أعد نسخ رمز البوت أو أعد توليده في BotFather، ثم حدث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضا فشل مصادقة؛ معاملته على أنها "لا يوجد webhook" لن تؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API لاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/proxy مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - بعض المضيفين يحلون `api.telegram.org` إلى IPv6 أولا؛ ويمكن أن يتسبب خروج IPv6 المعطل في حالات فشل متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء الاستطلاع، يعيد OpenClaw استخدام فحص بدء التشغيل الناجح `getMe` مع grammY بحيث لا يحتاج المشغل إلى `getMe` ثانية قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء الاستطلاع، يواصل OpenClaw الانتقال إلى الاستطلاع الطويل بدلا من إجراء استدعاء آخر لمستوى التحكم قبل الاستطلاع. يظهر Webhook لا يزال نشطا كتعارض `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويحاول تنظيف Webhook مرة أخرى.
    - إذا كانت مآخذ Telegram يعاد تدويرها وفق وتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ يثبت عملاء البوت القيم المكونة تحت حراس الطلبات الصادرة و`getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تجهض كل استطلاع أو رد عندما تضبط هذه القيمة تحت تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية دون اكتمال حيوية الاستطلاع الطويل افتراضيا.
    - يحذر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استطلاع قيد التشغيل قد أكمل `getUpdates` بعد فترة سماح بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد فترة سماح بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستطلاع قديما.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة لكن مضيفك لا يزال يبلغ عن عمليات إعادة تشغيل كاذبة بسبب توقف الاستطلاع. تشير حالات التوقف المستمرة عادة إلى مشكلات proxy أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يحترم Telegram أيضا متغيرات بيئة proxy للعملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` وصيغها ذات الأحرف الصغيرة. يمكن أن يظل `NO_PROXY` / `no_proxy` متجاوزا لـ `api.telegram.org`.
    - إذا كان proxy المدار من OpenClaw مكونا عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد بيئة proxy قياسية، يستخدم Telegram ذلك URL لنقل Bot API أيضا.
    - على مضيفي VPS ذوي خروج/TLS مباشر غير مستقر، وجه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضيا `autoSelectFamily=true` (باستثناء WSL2). يلتزم ترتيب نتائج DNS في Telegram بـ `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراض العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ إذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحة بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق معيار RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيا. إذا أعاد fake-IP أو
      proxy شفاف موثوق كتابة `api.telegram.org` إلى عنوان خاص/داخلي/مخصص لاستخدام خاص
      آخر أثناء تنزيلات الوسائط، يمكنك الاشتراك
      في التجاوز الخاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلم الخطر معطلا أولا. تسمح وسائط Telegram بالفعل بنطاق معيار RFC 2544
      افتراضيا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية Telegram
      من SSRF للوسائط. استخدمه فقط لبيئات proxy موثوقة يسيطر عليها المشغل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تنشئ
      إجابات خاصة أو مخصصة لاستخدام خاص خارج نطاق معيار RFC 2544. اتركه معطلا
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

## مرجع الإعداد

المرجع الأساسي: [مرجع الإعداد - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الإشارة">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ ترفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, المستوى الأعلى `bindings[]` (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- الخيوط/الردود: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- البث: `streaming` (معاينة), `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تكوين معرفي حساب أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحا. وإلا يعود OpenClaw إلى أول معرف حساب مطابق للتطبيع ويحذر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Telegram بالـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والموضوعات.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="توجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عابرة للقنوات.
  </Card>
</CardGroup>
