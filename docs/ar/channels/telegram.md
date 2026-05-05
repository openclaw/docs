---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-05T06:16:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c75169335378482b80f1ceb669cefaa034ad3e589cf5f1d14c8252608ee46a
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج للرسائل المباشرة للروبوت والمجموعات عبر grammY. وضع الاستقصاء الطويل هو الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الاقتران.
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
  <Step title="إنشاء رمز الروبوت في BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد من أن المعرّف هو تمامًا `@BotFather`).

    شغّل `/newbot`، واتبع التعليمات، واحفظ الرمز.

  </Step>

  <Step title="تكوين الرمز وسياسة الرسائل المباشرة">

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

    بديل متغيرات البيئة: `TELEGRAM_BOT_TOKEN=...` (الحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ كوّن الرمز في التكوين/البيئة، ثم شغّل Gateway.

  </Step>

  <Step title="تشغيل Gateway والموافقة على أول رسالة مباشرة">

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
ترتيب حلّ الرمز يراعي الحساب. عمليًا، تتقدم قيم التكوين على بديل متغيرات البيئة، ولا ينطبق `TELEGRAM_BOT_TOKEN` إلا على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعات">
    تستخدم روبوتات Telegram افتراضيًا **وضع الخصوصية**، ما يحدّ من رسائل المجموعات التي تستقبلها.

    إذا كان يجب أن يرى الروبوت جميع رسائل المجموعة، فإما أن:

    - تعطّل وضع الخصوصية عبر `/setprivacy`، أو
    - تجعل الروبوت مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل الروبوت + أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تستقبل الروبوتات المشرفة جميع رسائل المجموعة، وهذا مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح تبديل مفيدة في BotFather">

    - `/setjoingroups` للسماح بإضافة الروبوت إلى المجموعات أو منعها
    - `/setprivacy` لسلوك رؤية المجموعات

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يجد اسم مستخدم الروبوت أو يخمّنه أن يصدر أوامر للروبوت. استخدمه فقط للروبوتات العامة عمدًا ذات الأدوات المقيّدة بإحكام؛ يجب أن تستخدم الروبوتات ذات المالك الواحد `allowlist` مع معرّفات مستخدم رقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدم Telegram الرقمية. تُقبل البادئات `telegram:` / `tg:` وتُطبّع.
    في تكوينات الحسابات المتعددة، تُعامل قيمة `channels.telegram.allowFrom` المقيّدة على المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا إلا إذا ظلت قائمة السماح الفعلية للحساب تحتوي على حرف بدل صريح بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ جميع الرسائل المباشرة وترفضه عملية التحقق من التكوين.
    يطلب الإعداد معرّفات مستخدم رقمية فقط.
    إذا أجريت ترقية وكان تكوينك يحتوي على إدخالات قائمة سماح بصيغة `@username`، فشغّل `openclaw doctor --fix` لحلّها (بأفضل جهد؛ يتطلب رمز روبوت Telegram).
    إذا كنت تعتمد سابقًا على ملفات قوائم السماح في مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قوائم السماح (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    للروبوتات ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول ثابتة في التكوين (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    التباس شائع: الموافقة على اقتران الرسائل المباشرة لا تعني "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران الوصول إلى الرسائل المباشرة. إذا لم يكن مالك الأوامر موجودًا بعد، فإن أول اقتران معتمد يضبط أيضًا `commands.ownerAllowFrom` بحيث تكون للأوامر الخاصة بالمالك فقط وموافقات التنفيذ حساب مشغّل صريح.
    ما يزال تفويض مرسل المجموعة يأتي من قوائم سماح صريحة في التكوين.
    إذا أردت "أنا مخوّل مرة واحدة وتعمل الرسائل المباشرة وأوامر المجموعة معًا"، فضع معرّف مستخدم Telegram الرقمي لديك في `channels.telegram.allowFrom`؛ وبالنسبة للأوامر الخاصة بالمالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (بدون روبوت تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى روبوتك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة جهة خارجية (خصوصية أقل): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    ينطبق عنصران للتحكم معًا:

    1. **أي المجموعات مسموح بها** (`channels.telegram.groups`)
       - لا يوجد تكوين `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (افتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - عند تكوين `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح لهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يرجع Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدم Telegram رقمية (تُطبّع البادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. تنتمي معرّفات الدردشة السالبة إلى `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية عند تفويض المرسل.
    حد الأمان (`2026.2.25+`): تفويض مرسل المجموعة لا يرث موافقات مخزن اقتران الرسائل المباشرة.
    يبقى الاقتران خاصًا بالرسائل المباشرة فقط. للمجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/لكل موضوع.
    إذا لم يُضبط `groupAllowFrom`، يرجع Telegram إلى `allowFrom` في التكوين، وليس إلى مخزن الاقتران.
    النمط العملي للروبوتات ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فتعتمد قيم وقت التشغيل الافتراضية سياسة `groupPolicy="allowlist"` المغلقة عند الفشل ما لم يُضبط `channels.defaults.groupPolicy` صراحةً.

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

      - ضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تحديد الأشخاص داخل مجموعة مسموح بها القادرين على تشغيل الروبوت.
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

    الحصول على معرّف دردشة المجموعة:

    - أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص `getUpdates` في Bot API

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- تدير عملية Gateway تكامل Telegram.
- التوجيه حتمي: تُرد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى غلاف القناة المشترك مع بيانات تعريف الرد وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف مواضيع المنتدى `:topic:<threadId>` لإبقاء المواضيع معزولة.
- يمكن أن تحمل رسائل الرسائل المباشرة `message_thread_id`؛ يحافظ OpenClaw على معرّف السلسلة للردود لكنه يُبقي الرسائل المباشرة على الجلسة المسطحة افتراضيًا. كوّن `channels.telegram.dm.threadReplies: "inbound"` أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"` أو `requireTopic: true` أو تكوين موضوع مطابق عندما تريد عمدًا عزل جلسات مواضيع الرسائل المباشرة.
- يستخدم الاستقصاء الطويل مشغّل grammY مع تسلسل لكل دردشة/لكل سلسلة. يستخدم تزامن مصرف المشغّل الإجمالي `agents.defaults.maxConcurrent`.
- الاستقصاء الطويل محمي داخل كل عملية Gateway بحيث لا يمكن إلا لمستقصٍ نشط واحد استخدام رمز روبوت في كل مرة. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المرجح أن Gateway آخر لـ OpenClaw أو سكربتًا أو مستقصيًا خارجيًا يستخدم الرمز نفسه.
- تُشغّل عمليات إعادة تشغيل مراقب الاستقصاء الطويل بعد 120 ثانية بدون اكتمال حيوية `getUpdates` افتراضيًا. لا تزد `channels.telegram.pollingStallThresholdMs` إلا إذا كان نشرُك ما يزال يرى إعادات تشغيل خاطئة بسبب توقف الاستقصاء أثناء العمل طويل التشغيل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث الحي (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث ردود جزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلبات:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (افتراضي: `partial`)
    - يحافظ `progress` على مسودة حالة واحدة قابلة للتعديل ويحدّثها بتقدم الأدوات حتى التسليم النهائي
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة المعدّلة نفسها (افتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/التنفيذ داخل سطور تقدم الأدوات هذه: `raw` (افتراضي، يحافظ على السلوك الصادر) أو `status` (تسمية الأداة فقط)
    - تُكتشف `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأدوات هي سطور الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر أو قراءة الملفات أو تحديثات التخطيط أو ملخصات التصحيحات. يبقي Telegram هذه مفعّلة افتراضيًا لمطابقة سلوك OpenClaw الصادر منذ `v2026.4.22` وما بعده. للحفاظ على المعاينة المعدّلة لنص الإجابة مع إخفاء سطور تقدم الأدوات، اضبط:

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

    للحفاظ على ظهور تقدم الأدوات مع إخفاء نص الأمر/التنفيذ، اضبط:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليمًا نهائيًا فقط: يتم تعطيل تعديلات معاينة Telegram، ويتم كتم أحاديث الأدوات/التقدم العامة بدلًا من إرسالها كرسائل حالة مستقلة. ما زالت مطالبات الموافقة، وحمولات الوسائط، والأخطاء تمر عبر التسليم النهائي العادي. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأداة.

    <Note>
      ردود الاقتباس المحددة في Telegram هي الاستثناء. عندما تكون `replyToMode` هي `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تعديل معاينة الإجابة، لذلك لا يستطيع `streaming.preview.toolProgress` إظهار أسطر الحالة القصيرة لذلك الدور. ردود الرسالة الحالية من دون نص اقتباس محدد لا تزال تحتفظ ببث المعاينة. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأداة أهم من ردود الاقتباس الأصلية، أو اضبط `streaming.preview.toolProgress: false` للإقرار بهذه المفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات الرسائل المباشرة/المجموعات/المواضيع القصيرة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها، ما لم تُرسل رسالة مرئية غير معاينة بعد ظهور المعاينة
    - النهايات النصية الطويلة التي تنقسم إلى عدة رسائل Telegram تعيد استخدام المعاينة الحالية كأول جزء نهائي عندما يكون ذلك ممكنًا، ثم ترسل الأجزاء المتبقية فقط
    - المعاينات التي تتبعها مخرجات مرئية غير معاينة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة وينظف المعاينة الأقدم، بحيث تظهر الإجابة النهائية بعد المخرجات الوسيطة
    - المعاينات الأقدم من نحو دقيقة واحدة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة ثم ينظف المعاينة، بحيث يعكس الطابع الزمني المرئي في Telegram وقت الإكمال بدلًا من وقت إنشاء المعاينة

    للردود المعقدة (مثل حمولات الوسائط)، يرجع OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يتم تمكين بث الكتل صراحةً لـ Telegram، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة الحية أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما يجب أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية من دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر `parse_mode: "HTML"` في Telegram.

    - يُعرض النص الشبيه بـ Markdown كـ HTML آمن لـ Telegram.
    - يتم تهريب HTML الخام من النموذج لتقليل فشل تحليل Telegram.
    - إذا رفض Telegram تحليل HTML، يعيد OpenClaw المحاولة كنص عادي.

    يتم تمكين معاينات الروابط افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

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

    - تتم تسوية الأسماء (إزالة `/` البادئة، والتحويل إلى أحرف صغيرة)
    - النمط الصالح: `a-z`، و`0-9`، و`_`، بطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن أن تستمر أوامر Plugin/Skills في العمل عند كتابتها حتى إذا لم تظهر في قائمة Telegram

    إذا كانت الأوامر الأصلية معطلة، تُزال الأوامر المدمجة. قد تستمر أوامر Plugin/الأوامر المخصصة في التسجيل إذا كانت مهيأة.

    حالات فشل الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram لا تزال فائضة بعد القص؛ قلل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر Bot API المباشرة عبر curl أن `channels.telegram.apiRoot` تم ضبطه على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` هو جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستطلاع لذلك لا يُبلغ عن هذا كفشل في تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الجهاز (`device-pair` plugin)

    عند تثبيت `device-pair` plugin:

    1. ينشئ `/pair` رمز إعداد
    2. ألصق الرمز في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز Bootstrap قصير العمر. يبقي تسليم Bootstrap المدمج رمز العقدة الأساسية عند `scopes: []`؛ ويبقى أي رمز مشغّل مُسلّم محدودًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق Bootstrap مسبوقة بالدور، لذلك لا تفي قائمة السماح الخاصة بذلك المشغّل إلا بطلبات المشغّل؛ ولا تزال الأدوار غير المشغّلة تحتاج إلى نطاقات ضمن بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة بتفاصيل مصادقة متغيرة (مثل الدور/النطاقات/المفتاح العام)، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الإقران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمنة">
    هيئ نطاق لوحة المفاتيح المضمنة:

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

    تُمرر نقرات رد النداء إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram:

    - `sendMessage` (`to`، `content`، اختياريًا `mediaUrl`، و`replyToMessageId`، و`messageThreadId`)
    - `react` (`chatId`، و`messageId`، و`emoji`)
    - `deleteMessage` (`chatId`، و`messageId`)
    - `editMessage` (`chatId`، و`messageId`، و`content`)
    - `createForumTopic` (`chatId`، و`name`، اختياريًا `iconColor`، و`iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء مستعارة مريحة (`send`، و`react`، و`delete`، و`edit`، و`sticker`، و`sticker-search`، و`topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (افتراضي: معطل)

    ملاحظة: يتم تمكين `edit` و`topic-create` حاليًا افتراضيًا وليست لهما مفاتيح تبديل منفصلة ضمن `channels.telegram.actions.*`.
    تستخدم الإرسالات وقت التشغيل لقطة التهيئة/الأسرار النشطة (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل ردود صريحة في المخرجات المولدة:

    - يرد `[[reply_to_current]]` على الرسالة المشغّلة
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عند تمكين تسلسل الردود وتوفر نص Telegram الأصلي أو التسمية التوضيحية الأصلية، يضمن OpenClaw مقتطف اقتباس أصليًا من Telegram تلقائيًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وترجع إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطل `off` تسلسل الردود الضمني. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة للمنتدى:

    - تضيف مفاتيح جلسة الموضوع `:topic:<threadId>`
    - تستهدف الردود والكتابة سلسلة الموضوع
    - مسار تهيئة الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    توريث الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`، و`allowFrom`، و`skills`، و`systemPrompt`، و`enabled`، و`groupPolicy`).
    `agentId` خاص بالموضوع فقط ولا يرث من الإعدادات الافتراضية للمجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف عبر ضبط `agentId` في تهيئة الموضوع. يمنح هذا كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

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

    **ربط موضوع ACP الدائم**: يمكن لمواضيع المنتدى تثبيت جلسات أحزمة ACP عبر روابط ACP typed عليا (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي مقصور على مواضيع المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتوجّه المتابعات إليها مباشرة. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب أن يبقى `channels.telegram.threadBindings.spawnSessions` ممكّنًا (افتراضيًا: `true`).

    تعرض سياقات القوالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تحتوي على `message_thread_id` بتوجيه الرسائل المباشرة وبيانات الرد الوصفية في الجلسات المسطحة افتراضيًا؛ ولا تستخدم مفاتيح الجلسة المدركة للخيوط إلا عند ضبطها باستخدام `threadReplies: "inbound"` أو `threadReplies: "always"` أو `requireTopic: true` أو إعداد موضوع مطابق. استخدم `channels.telegram.dm.threadReplies` ذي المستوى الأعلى للإعداد الافتراضي للحساب، أو `direct.<chatId>.threadReplies` لرسالة مباشرة واحدة.

  </Accordion>

  <Accordion title="الصوت، والفيديو، والملصقات">
    ### رسائل الصوت

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف الصوت
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطَّر نصوص الملاحظات الصوتية الواردة كنص مولَّد آليًا وغير موثوق
      في سياق الوكيل؛ ولا يزال اكتشاف الإشارات يستخدم النص الخام
      لكي تواصل الرسائل الصوتية المقيدة بالإشارات العمل.

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

  <Accordion title="إشعارات التفاعلات">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند تفعيلها، يضع OpenClaw أحداث نظام في قائمة الانتظار مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    الإعداد:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - يعني `own` تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة تخزين الرسائل المرسلة مؤقتًا).
    - لا تزال أحداث التفاعل تحترم عناصر التحكم في وصول Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ ويُسقَط المرسلون غير المصرح لهم.
    - لا يوفر Telegram معرّفات الخيوط في تحديثات التفاعل.
      - تُوجَّه المجموعات غير المنتدى إلى جلسة محادثة المجموعة
      - تُوجَّه مجموعات المنتدى إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي المحدد بدقة

    يتضمن `allowed_updates` للاستقصاء/Webhook قيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل رمز تعبيري من هوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رمزًا تعبيريًا unicode (على سبيل المثال "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعداد من أحداث Telegram وأوامره">
    تُفعَّل كتابات إعداد القناة افتراضيًا (`configWrites !== false`).

    تتضمن الكتابات المشغلة من Telegram:

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

  <Accordion title="الاستقصاء الطويل مقابل Webhook">
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook، اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ ويمكن اختياريًا ضبط `webhookPath` و`webhookHost` و`webhookPort` (الافتراضيات `/telegram-webhook` و`127.0.0.1` و`8787`).

    يربط المستمع المحلي نفسه بـ `127.0.0.1:8787`. للدخول العام، ضع وكيلًا عكسيًا أمام المنفذ المحلي أو اضبط `webhookHost: "0.0.0.0"` عمدًا.

    يتحقق وضع Webhook من حراس الطلبات، ورمز Telegram السري، وجسم JSON قبل إرجاع `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل محادثة/لكل موضوع التي يستخدمها الاستقصاء الطويل، لذلك لا تجعل دورات الوكيل البطيئة إقرار التسليم من Telegram ينتظر.

  </Accordion>

  <Accordion title="الحدود، وإعادة المحاولة، وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يحدد `channels.telegram.mediaMaxMb` (الافتراضي 100) الحد الأقصى لحجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتًا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زد القيمة إذا وصلت أجزاء الألبوم متأخرة؛ وخفّضها لتقليل زمن انتظار رد الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم يُضبط، تنطبق القيمة الافتراضية لـ grammY). تقيد عملاء البوت القيم المضبوطة تحت حارس طلب النص/الكتابة الصادر لمدة 60 ثانية حتى لا يوقف grammY تسليم الرد المرئي قبل أن يتمكن حارس النقل والبديل في OpenClaw من العمل. لا يزال الاستقصاء الطويل يستخدم حارس طلب `getUpdates` لمدة 45 ثانية حتى لا تُترك الاستقصاءات الخاملة إلى أجل غير مسمى.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ وتؤدي `0` إلى تعطيله.
    - يُمرَّر السياق التكميلي للرد/الاقتباس/إعادة التوجيه حاليًا كما تم تلقيه.
    - تتحكم قوائم السماح في Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - ينطبق إعداد `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة إرسال آمن محدودة لفشل Telegram قبل الاتصال، لكنه لا يعيد محاولة أغلفة الشبكة الغامضة بعد الإرسال التي يمكن أن تكرر الرسائل المرئية.

    يمكن أن تكون أهداف الإرسال في CLI وأداة الرسائل معرّف محادثة رقميًا، أو اسم مستخدم، أو هدف موضوع منتدى:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    تستخدم استقصاءات Telegram الأمر `openclaw message poll` وتدعم موضوعات المنتدى:

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
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع البوت التثبيت في تلك المحادثة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من تحميلات الصور المضغوطة أو الوسائط المتحركة

    تقييد الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستقصاءات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استقصاءات Telegram مع إبقاء عمليات الإرسال العادية مفعلة

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في المحادثة أو الموضوع الأصلي. يجب أن يكون الموافقون معرّفات مستخدمي Telegram رقمية.

    مسار الإعداد:

    - `channels.telegram.execApprovals.enabled` (يُفعَّل تلقائيًا عند إمكانية حل موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع احتياطيًا إلى معرّفات المالكين الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    يتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. ولا تجعل شخصًا ما موافقًا على التنفيذ. تؤسس أول عملية إقران رسائل مباشرة معتمدة قيمة `commands.ownerAllowFrom` عندما لا يوجد مالك أمر بعد، لذلك يظل إعداد المالك الواحد يعمل دون تكرار المعرّفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في المحادثة؛ لا تفعّل `channel` أو `both` إلا في المجموعات/الموضوعات الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بسطح الهدف (`dm` أو `group` أو `all`). تُحل معرّفات الموافقة المسبوقة بـ `plugin:` عبر موافقات Plugin؛ أما الأخرى فتُحل عبر موافقات التنفيذ أولًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزود، يمكن لـ Telegram إما الرد بنص الخطأ أو حجبه. يتحكم مفتاحا إعداد في هذا السلوك:

| المفتاح                             | القيم             | الافتراضي | الوصف                                                                                          |
| ----------------------------------- | ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`   | يرسل `reply` رسالة خطأ ودودة إلى المحادثة. يحجب `silent` ردود الأخطاء بالكامل.                 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`   | الحد الأدنى للوقت بين ردود الأخطاء إلى المحادثة نفسها. يمنع رسائل الخطأ المزعجة أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنمط الوراثة نفسه مثل مفاتيح إعداد Telegram الأخرى).

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
      - ثم أزل الروبوت من المجموعة وأعد إضافته إليها
    - يحذّر `openclaw channels status` عندما يتوقع الإعداد رسائل مجموعة بلا ذكر.
    - يستطيع `openclaw channels status --probe` فحص معرّفات المجموعات الرقمية الصريحة؛ ولا يمكن فحص العضوية للنمط العام `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - عند وجود `channels.telegram.groups`، يجب أن تكون المجموعة مدرجة (أو يتضمن ذلك `"*"`)
    - تحقق من عضوية الروبوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - فوّض هوية المرسل لديك (الإقران و/أو `allowFrom` الرقمي)
    - يظل تفويض الأوامر مطبقًا حتى عندما تكون سياسة المجموعة `open`
    - يعني فشل `setMyCommands` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على إدخالات كثيرة جدًا؛ قلّل أوامر Plugin/Skill/الأوامر المخصصة أو عطّل القوائم الأصلية
    - تكون استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات الكتابة `sendChatAction` محدودة وتعيد المحاولة مرة واحدة عبر احتياطي نقل Telegram عند انتهاء مهلة الطلب. عادةً ما تشير أخطاء الشبكة/الجلب المستمرة إلى مشكلات في إمكانية وصول DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` هو فشل مصادقة من Telegram لرمز الروبوت المضبوط.
    - أعد نسخ رمز الروبوت أو توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضًا فشل مصادقة؛ فالتعامل معه على أنه "لا يوجد Webhook" لن يؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API لاحقة.

  </Accordion>

  <Accordion title="Polling or network instability">

    - يمكن أن يؤدي Node 22+ مع جلب/وكيل مخصص إلى سلوك إجهاض فوري إذا اختلفت أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ وقد يتسبب خروج IPv6 المعطل في حالات فشل متقطعة في API الخاص بـ Telegram.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستقصاء، يعيد OpenClaw استخدام فحص `getMe` الناجح في بدء التشغيل لصالح grammY حتى لا يحتاج المشغّل إلى `getMe` ثانية قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بخطأ شبكة عابر أثناء بدء تشغيل الاستقصاء، يواصل OpenClaw الدخول في الاستقصاء الطويل بدلًا من إجراء استدعاء آخر لمستوى التحكم قبل الاستقصاء. يظهر Webhook الذي لا يزال نشطًا كتعارض `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويعيد محاولة تنظيف Webhook.
    - إذا كانت مقابس Telegram يعاد تدويرها بوتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ يقيّد عملاء الروبوت القيم المضبوطة دون حراس طلبات الخروج و`getUpdates`، لكن الإصدارات الأقدم قد تلغي كل استقصاء أو رد عندما كانت هذه القيمة مضبوطة دون تلك الحراس.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستقصاء ويعيد بناء نقل Telegram بعد 120 ثانية بلا اكتمال حيوية الاستقصاء الطويل افتراضيًا.
    - يحذّر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استقصاء قيد التشغيل قد أكمل `getUpdates` بعد مهلة بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد مهلة بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستقصاء قديمًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` طويلة الأمد سليمة لكن مضيفك ما زال يبلغ كذبًا عن عمليات إعادة تشغيل بسبب تعثر الاستقصاء. تشير التعثرات المستمرة عادةً إلى مشكلات في الوكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يحترم Telegram أيضًا بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` ومتغيراتها بالأحرف الصغيرة. ويمكن أن يظل `NO_PROXY` / `no_proxy` يتجاوز `api.telegram.org`.
    - إذا ضُبط وكيل OpenClaw المدار عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد بيئة وكيل قياسية، يستخدم Telegram ذلك العنوان لنقل Bot API أيضًا.
    - على مضيفات VPS ذات خروج/TLS مباشر غير مستقر، وجّه استدعاءات API الخاصة بـ Telegram عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2). يراعي ترتيب نتائج DNS في Telegram أولًا `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراضي العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ وإذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحةً بشكل أفضل بسلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق قياس RFC 2544 (`198.18.0.0/15`) مسموح بها مسبقًا
      لتنزيلات وسائط Telegram افتراضيًا. إذا كان fake-IP موثوقًا أو
      وكيل شفاف يعيد كتابة `api.telegram.org` إلى عنوان آخر
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
      العلم الخطر معطلًا أولًا. تسمح وسائط Telegram بالفعل بنطاق قياس
      RFC 2544 افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حماية
      وسائط Telegram من SSRF. استخدمه فقط لبيئات الوكيل الموثوقة التي يتحكم بها
      المشغّل مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما
      تولّد إجابات خاصة أو ذات استخدام خاص خارج نطاق قياس RFC 2544.
      اتركه معطلًا لوصول Telegram العادي عبر الإنترنت العام.
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

<Accordion title="High-signal Telegram fields">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ ترفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, المستوى الأعلى `bindings[]` (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- الترابط/الردود: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- البث: `streaming` (معاينة)، `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تُضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند ضبط معرّفين أو أكثر للحسابات، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا يعود OpenClaw إلى أول معرّف حساب بعد التطبيع ويحذّر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    أقرن مستخدم Telegram بـ Gateway.
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
