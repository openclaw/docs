---
read_when:
    - العمل على ميزات Telegram أو خطافات Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:46:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5711d53cf908a14024bc5a94f7d590bb4bcb6963a1d78049d7782871f4eae932
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة للبوت والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ وضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات وخطط إصلاح عابرة للقنوات.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعدادات القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز البوت في BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد أن المعرّف هو بالضبط `@BotFather`).

    شغّل `/newbot`، واتبع التعليمات، واحفظ الرمز.

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

    الرجوع إلى متغير البيئة: `TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ اضبط الرمز في الإعدادات/البيئة، ثم ابدأ Gateway.

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
    أضف البوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يطابق نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حلّ الرموز يراعي الحسابات. عمليًا، لقيم الإعدادات أولوية على الرجوع إلى البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وإمكانية رؤية المجموعة">
    تستخدم بوتات Telegram افتراضيًا **وضع الخصوصية**، وهو ما يحد مما تتلقاه من رسائل المجموعات.

    إذا كان يجب أن يرى البوت كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل البوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل البوت ثم أعد إضافته في كل مجموعة حتى يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى البوتات المشرفة كل رسائل المجموعة، وهذا مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather المفيدة">

    - `/setjoingroups` للسماح بإضافة البوت إلى المجموعات أو منعها
    - `/setprivacy` لسلوك إمكانية الرؤية في المجموعات

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول عبر الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يعثر على اسم مستخدم البوت أو يخمنه أن يصدر أوامر للبوت. استخدمه فقط للبوتات العامة عمدًا ذات الأدوات المقيّدة بشدة؛ ويجب أن تستخدم البوتات ذات المالك الواحد `allowlist` مع معرّفات مستخدم رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل البادئتان `telegram:` / `tg:` وتُطبّعان.
    في إعدادات الحسابات المتعددة، يُعامل `channels.telegram.allowFrom` التقييدي في المستوى الأعلى كحد أمان: إدخالات `allowFrom: ["*"]` على مستوى الحساب لا تجعل ذلك الحساب عامًا إلا إذا ظلت قائمة السماح الفعلية للحساب تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة، وترفضه عملية التحقق من الإعدادات.
    يطلب الإعداد معرّفات المستخدم الرقمية فقط.
    إذا أجريت ترقية وكانت إعداداتك تحتوي على إدخالات قائمة سماح بشكل `@username`، فشغّل `openclaw doctor --fix` لحلّها (بأفضل جهد؛ يتطلب رمز بوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في مسارات قوائم السماح (على سبيل المثال عندما لا يحتوي `dmPolicy: "allowlist"` على أي معرّفات صريحة بعد).

    للبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول ثابتة في الإعدادات (بدلًا من الاعتماد على موافقات اقتران سابقة).

    لبس شائع: الموافقة على اقتران الرسائل المباشرة لا تعني أن "هذا المرسل مخول في كل مكان".
    يمنح الاقتران وصول الرسائل المباشرة. إذا لم يكن هناك مالك أوامر بعد، فإن أول اقتران معتمد يضبط أيضًا `commands.ownerAllowFrom` بحيث يكون للأوامر المقتصرة على المالك وموافقات التنفيذ حساب مشغّل صريح.
    ما زال تفويض مرسل المجموعة يأتي من قوائم السماح الصريحة في الإعدادات.
    إذا أردت "أنا مخول مرة واحدة وتعمل كل من الرسائل المباشرة وأوامر المجموعة"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`؛ وبالنسبة للأوامر المقتصرة على المالك، تأكد أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    طريقة أكثر أمانًا (من دون بوت طرف ثالث):

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
    ينطبق تحكمان معًا:

    1. **أي المجموعات مسموح بها** (`channels.telegram.groups`)
       - لا توجد إعدادات `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم ضبط `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح لهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram الرقمية (تُطبّع بادئتا `telegram:` / `tg:`).
    لا تضع معرّفات محادثات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. مكان معرّفات المحادثة السالبة هو `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية في تفويض المرسل.
    حد الأمان (`2026.2.25+`): لا يرث تفويض مرسل المجموعة موافقات مخزن اقتران الرسائل المباشرة.
    يبقى الاقتران مخصصًا للرسائل المباشرة فقط. بالنسبة للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/كل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في الإعدادات، وليس إلى مخزن الاقتران.
    نمط عملي للبوتات ذات المالك الواحد: ضع معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، تكون افتراضات وقت التشغيل مغلقة افتراضيًا باستخدام `groupPolicy="allowlist"` ما لم يُضبط `channels.defaults.groupPolicy` صراحة.

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
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تحديد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل البوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى البوت.

    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب ردود المجموعات إشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية بشكل `@botusername`، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تحدّث هذه حالة الجلسة فقط. استخدم الإعدادات للاستمرارية.

    مثال إعداد مستمر:

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

    - أعد توجيه رسالة من المجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص `getUpdates` في Bot API

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يملك عملية Gateway تكامل Telegram.
- التوجيه حتمي: ترد رسائل Telegram الواردة إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى مظروف القناة المشترك مع بيانات تعريف الرد والعناصر النائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف موضوعات المنتديات `:topic:<threadId>` لإبقاء الموضوعات معزولة.
- يمكن أن تحمل رسائل DM القيمة `message_thread_id`؛ يحافظ OpenClaw على معرّف السلسلة للردود لكنه يُبقي الرسائل المباشرة على الجلسة المسطحة افتراضيًا. اضبط `channels.telegram.dm.threadReplies: "inbound"` أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"` أو `requireTopic: true` أو إعداد موضوع مطابقًا عندما تريد عمدًا عزل جلسة موضوع الرسائل المباشرة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل محادثة/كل سلسلة. يستخدم تزامن حوض المشغّل العام `agents.defaults.maxConcurrent`.
- الاستقصاء الطويل محمي داخل كل عملية Gateway بحيث لا يستطيع استخدام رمز بوت إلا مستقصٍ نشط واحد في كل مرة. إذا كنت ما تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر من OpenClaw أو سكربتًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تُشغَّل إعادة تشغيل مراقب الاستقصاء الطويل افتراضيًا بعد 120 ثانية من دون اكتمال حيوية `getUpdates`. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك ما يزال يرى إعادات تشغيل خاطئة بسبب توقف الاستقصاء أثناء أعمال طويلة التشغيل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث الحي (تعديلات الرسائل)">
    يستطيع OpenClaw بث ردود جزئية في الوقت الحقيقي:

    - المحادثات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يحافظ `progress` على مسودة حالة واحدة قابلة للتعديل ويحدّثها بتقدم الأدوات حتى التسليم النهائي
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المعدّلة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل سطور تقدم الأدوات تلك: `raw` (الافتراضي، يحافظ على السلوك المنشور) أو `status` (تسمية الأداة فقط)
    - تُكتشف قيم `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي سطور الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، أو قراءة الملفات، أو تحديثات التخطيط، أو ملخصات التصحيحات. يبقي Telegram هذه مفعلة افتراضيًا لمطابقة سلوك OpenClaw المنشور من `v2026.4.22` وما بعده. للإبقاء على المعاينة المعدّلة لنص الإجابة مع إخفاء سطور تقدم الأدوات، اضبط:

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

    لوضع مسودة التقدم، ضع سياسة نص الأمر نفسها ضمن `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليم الإجابة النهائية فقط: تُعطَّل تعديلات معاينة Telegram، وتُكتم ثرثرة الأدوات/التقدم العامة بدل إرسالها كرسائل حالة مستقلة. لا تزال مطالبات الموافقة، وحمولات الوسائط، والأخطاء تمر عبر مسار التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأداة.

    <Note>
      ردود الاقتباس المحدد في Telegram هي الاستثناء. عندما تكون `replyToMode` هي `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدل تعديل معاينة الإجابة، لذلك لا يمكن لـ `streaming.preview.toolProgress` إظهار أسطر الحالة القصيرة لذلك الدور. لا تزال الردود على الرسالة الحالية من دون نص اقتباس محدد تحتفظ بتدفق المعاينة. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأداة أهم من ردود الاقتباس الأصلية، أو اضبط `streaming.preview.toolProgress: false` للإقرار بالمفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات DM/المجموعة/الموضوع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها وينفذ تعديلًا نهائيًا في مكانها، ما لم تُرسَل رسالة مرئية غير معاينة بعد ظهور المعاينة
    - معاينات تليها مخرجات مرئية غير معاينة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة وينظف المعاينة القديمة، بحيث تظهر الإجابة النهائية بعد المخرجات الوسيطة
    - المعاينات الأقدم من نحو دقيقة واحدة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة ثم ينظف المعاينة، بحيث يعكس الطابع الزمني المرئي في Telegram وقت الإكمال بدل وقت إنشاء المعاينة

    للردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    تدفق المعاينة منفصل عن تدفق الكتل. عند تفعيل تدفق الكتل صراحةً لـ Telegram، يتجاوز OpenClaw تدفق المعاينة لتجنب التدفق المزدوج.

    تدفق الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة الحية أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما يجب أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر في Telegram `parse_mode: "HTML"`.

    - يُعرَض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - يُهَرَّب HTML الخام من النموذج لتقليل حالات فشل التحليل في Telegram.
    - إذا رفض Telegram HTML المحلل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    يُعالَج تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

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

    - تُوحَّد الأسماء (إزالة `/` البادئة، وتحويلها إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، الطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - تُتجاهل التعارضات/التكرارات وتُسجَّل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن أن تظل أوامر Plugin/Skills تعمل عند كتابتها حتى إن لم تظهر في قائمة Telegram

    إذا عُطِّلت الأوامر الأصلية، تُزال الأوامر المضمنة. قد تظل أوامر Plugin/المخصصة تُسجَّل إذا كانت مضبوطة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال تتجاوز الحد بعد القص؛ قلل أوامر Plugin/Skills/المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API أن `channels.telegram.apiRoot` ضُبط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` لاحقة `/bot<TOKEN>` العرضية.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المضبوط. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء، لذلك لا يُبلَّغ عن هذا كفشل في تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر اقتران الجهاز (`device-pair` Plugin)

    عند تثبيت `device-pair` Plugin:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. يُبقي تسليم التمهيد المضمن رمز العقدة الأساسية عند `scopes: []`؛ وأي رمز مشغّل مُسلَّم يبقى محدودًا إلى `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. فحوص نطاق التمهيد مسبوقة بالدور، لذلك لا تفي قائمة سماح المشغل هذه إلا بطلبات المشغل؛ ولا تزال الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة مع تفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. شغّل `/pair pending` مجددًا قبل الموافقة.

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

    تُمرَّر نقرات رد الاتصال إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أدوات Telegram:

    - `sendMessage` (`to`, `content`, اختياريًا `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, اختياريًا `iconColor`, `iconCustomEmojiId`)

    تكشف إجراءات رسائل القناة أسماءً بديلة مريحة (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في البوابات:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطّل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل `channels.telegram.actions.*` منفصلة.
    تستخدم عمليات الإرسال وقت التشغيل لقطة الإعداد/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef ارتجالية لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم ترابط الردود">
    يدعم Telegram وسوم ترابط ردود صريحة في المخرجات المُولَّدة:

    - يرد `[[reply_to_current]]` على الرسالة المحفزة
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (الافتراضي)
    - `first`
    - `all`

    عند تفعيل ترابط الردود وتوفر نص Telegram الأصلي أو التعليق، يضمّن OpenClaw مقتطف اقتباس أصليًا من Telegram تلقائيًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` ترابط الردود الضمني. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتدى:

    - تضيف مفاتيح جلسة الموضوع `:topic:<threadId>`
    - تستهدف الردود وحالة الكتابة سلسلة الموضوع
    - مسار إعداد الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram `sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم تُتجاوز (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من افتراضيات المجموعة.

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

    بعد ذلك يكون لكل موضوع مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط موضوع ACP الدائم**: يمكن لموضوعات المنتدى تثبيت جلسات حزمة ACP عبر روابط ACP typed عالية المستوى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي مخصص لموضوعات المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP المرتبط بالسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه المتابعات إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (الافتراضي: `true`).

    يعرض سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة وبيانات الرد الوصفية في الجلسات المسطحة افتراضيًا؛ ولا تستخدم مفاتيح الجلسة المدركة للخيوط إلا عند تهيئتها باستخدام `threadReplies: "inbound"` أو `threadReplies: "always"` أو `requireTopic: true` أو إعداد موضوع مطابق. استخدم `channels.telegram.dm.threadReplies` في المستوى الأعلى للإعداد الافتراضي للحساب، أو `direct.<chatId>.threadReplies` لرسالة مباشرة واحدة.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الإعداد الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطَّر نصوص الملاحظات الصوتية الواردة كنص منشأ آليًا
      وغير موثوق به في سياق الوكيل؛ ولا يزال اكتشاف الإشارات يستخدم النص
      الخام، لذا تستمر رسائل الصوت المقيدة بالإشارة في العمل.

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

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويُرسل نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزَّل ويُعالَج (العنصر النائب `<media:sticker>`)
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

    تُوصَف الملصقات مرة واحدة (عند الإمكان) وتُخزَّن مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

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

    عند تفعيلها، يضع OpenClaw أحداث النظام في الطابور مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدمين مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة الرسائل المرسلة المؤقتة).
    - لا تزال أحداث التفاعل تراعي عناصر التحكم في وصول Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ ويُسقَط المرسلون غير المصرح لهم.
    - لا يوفر Telegram معرّفات الخيوط في تحديثات التفاعل.
      - تُوجَّه المجموعات غير المنتديات إلى جلسة محادثة المجموعة
      - تُوجَّه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/Webhook `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رمزًا تعبيريًا unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    تكون كتابات إعدادات القناة مفعلة افتراضيًا (`configWrites !== false`).

    تشمل الكتابات التي يطلقها Telegram:

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

  <Accordion title="Long polling vs webhook">
    الإعداد الافتراضي هو الاستقصاء الطويل. لوضع Webhook عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ والاختيارية `webhookPath` و`webhookHost` و`webhookPort` (الافتراضيات `/telegram-webhook` و`127.0.0.1` و`8787`).

    يرتبط المستمع المحلي بـ `127.0.0.1:8787`. للدخول العام، إما أن تضع وكيلاً عكسيًا أمام المنفذ المحلي أو تعيّن `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حراس الطلبات، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    يعالج OpenClaw بعد ذلك التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل محادثة/لكل موضوع المستخدمة في الاستقصاء الطويل، لذلك لا تؤخر أدوار الوكيل البطيئة إقرار التسليم الخاص بـ Telegram.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - الافتراضي لـ `channels.telegram.textChunkLimit` هو 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحد `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتًا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زِد القيمة إذا وصلت أجزاء الألبوم متأخرة؛ وقللها لتقليل زمن انتظار الرد على الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُعيّن، ينطبق افتراضي grammY). تثبت عملاء البوت القيم المهيأة الأقل من حارس طلبات النص/الكتابة الصادر ذي 60 ثانية حتى لا يوقف grammY تسليم الرد المرئي قبل تشغيل حارس نقل OpenClaw والرجوع الاحتياطي. لا يزال الاستقصاء الطويل يستخدم حارس طلب `getUpdates` مدته 45 ثانية حتى لا تُترك الاستقصاءات الخاملة إلى أجل غير مسمى.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لعمليات إعادة تشغيل تعثر الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتعطله `0`.
    - يُمرَّر السياق التكميلي للرد/الاقتباس/إعادة التوجيه حاليًا كما استُلم.
    - تضبط قوائم السماح في Telegram أساسًا من يمكنه تشغيل الوكيل، وليست حدًا كاملاً لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة إرسال آمنة محدودة لإخفاقات Telegram قبل الاتصال، لكنه لا يعيد محاولة أغطية الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

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

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح بها `channels.telegram.capabilities.inlineButtons`
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع البوت التثبيت في تلك المحادثة
    - `--force-document` لإرسال الصور وGIF الصادرة كمستندات بدلاً من تحميلات الصور المضغوطة أو الوسائط المتحركة

    ضبط الإجراءات:

    - يعطل `channels.telegram.actions.sendMessage=false` رسائل Telegram الصادرة، بما في ذلك الاستقصاءات
    - يعطل `channels.telegram.actions.poll=false` إنشاء استقصاءات Telegram مع إبقاء الإرسال العادي مفعلاً

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في المحادثة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يتفعّل تلقائيًا عندما يكون هناك موافق واحد على الأقل قابل للحل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرّفات المالكين الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (افتراضي) | `channel` | `both`
    - `agentFilter` و`sessionFilter`

    يتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. ولا تجعل شخصًا ما موافقًا على التنفيذ. يمهد أول اقتران رسالة مباشرة معتمد لـ `commands.ownerAllowFrom` عندما لا يوجد مالك أمر بعد، لذلك لا يزال إعداد المالك الواحد يعمل دون تكرار المعرّفات تحت `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في المحادثة؛ فعّل `channel` أو `both` فقط في المجموعات/المواضيع الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح المستهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة المسبوقة بـ `plugin:` عبر موافقات Plugin؛ أما غيرها فيُحل عبر موافقات التنفيذ أولاً.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزود، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                       |
| ----------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودية إلى المحادثة. يكتم `silent` ردود الأخطاء بالكامل.              |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى المحادثة نفسها. يمنع رسائل الخطأ المتكررة أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بالوراثة نفسها مثل مفاتيح إعداد Telegram الأخرى).

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
      - BotFather: `/setprivacy` -> تعطيل
      - ثم أزِل البوت من المجموعة وأعد إضافته
    - يحذّر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة غير مذكورة.
    - يمكن لـ `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص عضوية حرف البدل `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقًا">

    - عند وجود `channels.telegram.groups`، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقّق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - صرّح لهوية المرسل لديك (الاقتران و/أو `allowFrom` الرقمي)
    - يظل تصريح الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة وتُعاد مرة واحدة عبر بديل نقل Telegram عند انتهاء مهلة الطلب. عادةً ما تشير أخطاء الشبكة/الجلب المستمرة إلى مشكلات في إمكانية الوصول عبر DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="بدء التشغيل يبلغ عن رمز غير مصرح به">

    - `getMe returned 401` هو فشل مصادقة Telegram لرمز البوت المكوّن.
    - أعد نسخ رمز البوت أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضًا فشل مصادقة؛ التعامل معه على أنه "لا يوجد Webhook" لن يؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API لاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستقصاء أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع fetch/وكيل مخصص إلى سلوك إجهاض فوري إذا لم تتطابق أنواع AbortSignal.
    - بعض المضيفين يحلون `api.telegram.org` إلى IPv6 أولًا؛ وقد يتسبب خروج IPv6 المعطل في إخفاقات متقطعة في API الخاص بـ Telegram.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن المحاولة مع هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستقصاء، يعيد OpenClaw استخدام فحص بدء التشغيل الناجح `getMe` لـ grammY حتى لا يحتاج المشغّل إلى `getMe` ثانٍ قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، يواصل OpenClaw إلى الاستقصاء الطويل بدلًا من إجراء استدعاء آخر لمستوى التحكم قبل الاستقصاء. يظهر Webhook الذي ما زال نشطًا كتعارض في `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا كانت مقابس Telegram تُعاد تدويرها وفق وتيرة ثابتة قصيرة، فتحقّق من انخفاض `channels.telegram.timeoutSeconds`؛ يقيّد عملاء البوت القيم المكوّنة أدنى من حراس الطلب الصادر و`getUpdates`، لكن الإصدارات الأقدم قد تُجهض كل استقصاء أو رد عندما كانت هذه القيمة مضبوطة أدنى من تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، فإن OpenClaw يعيد تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية افتراضيًا دون اكتمال حيوية الاستقصاء الطويل.
    - يحذّر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستقصاء قديمًا.
    - لا تزد `channels.telegram.pollingStallThresholdMs` إلا عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة، لكن مضيفك ما زال يبلغ خطأً عن إعادة تشغيل بسبب توقف الاستقصاء. عادةً ما تشير التوقفات المستمرة إلى مشكلات في الوكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يحترم Telegram أيضًا متغيرات بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` وصيغها بحروف صغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان وكيل OpenClaw المُدار مكوّنًا عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد بيئة وكيل قياسية، يستخدم Telegram ذلك الرابط لنقل Bot API أيضًا.
    - على مضيفي VPS ذوي خروج/TLS المباشر غير المستقر، وجّه استدعاءات API الخاصة بـ Telegram عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2). يتبع ترتيب نتائج DNS لـ Telegram `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم الإعداد الافتراضي للعملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ إذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل بوضوح على نحو أفضل بسلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق القياس المعياري RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضيًا. إذا كان وكيل fake-IP موثوق أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان خاص/داخلي/خاص الاستخدام آخر
      أثناء تنزيلات الوسائط، يمكنك الاشتراك في تجاوز خاص بـ Telegram فقط:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر الاشتراك نفسه لكل حساب عند
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان وكيلك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلم الخطر متوقفًا أولًا. تسمح وسائط Telegram بالفعل بنطاق القياس
      المعياري RFC 2544 افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية SSRF
      لوسائط Telegram. استخدمه فقط في بيئات الوكلاء الموثوقة التي يتحكم بها المشغّل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تولّد
      إجابات خاصة أو خاصة الاستخدام خارج نطاق القياس المعياري RFC 2544.
      اتركه متوقفًا للوصول العادي إلى Telegram عبر الإنترنت العام.
    </Warning>

    - تجاوزات البيئة (مؤقتة):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - تحقّق من إجابات DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

مزيد من المساعدة: [استكشاف مشكلات القنوات وإصلاحها](/ar/channels/troubleshooting).

## مرجع الإعداد

المرجع الأساسي: [مرجع الإعداد - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية القيمة">

- بدء التشغيل/المصادقة: `enabled`، `botToken`، `tokenFile`، `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`، `groups.*.topics.*`، `bindings[]` في المستوى الأعلى (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`، `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`، `commands.nativeSkills`، `customCommands`
- الخيوط/الردود: `replyToMode`، `dm.threadReplies`، `direct.*.threadReplies`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`، `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`، `chunkMode`، `linkPreview`، `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`، `mediaGroupFlushMs`، `timeoutSeconds`، `pollingStallThresholdMs`، `retry`، `network.autoSelectFamily`، `network.dangerouslyAllowPrivateNetwork`، `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`، `webhookSecret`، `webhookPath`، `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`، `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`، `reactionLevel`
- الأخطاء: `errorPolicy`، `errorCooldownMs`
- الكتابات/السجل: `configWrites`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عندما يكون معرّفا حسابين أو أكثر مكوّنين، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يعود OpenClaw إلى أول معرّف حساب مطبّع ويحذّر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Telegram بـ Gateway.
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
