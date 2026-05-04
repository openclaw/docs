---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتكوينه
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

جاهز للإنتاج لرسائل bot المباشرة والمجموعات عبر grammY. Long polling هو الوضع الافتراضي؛ وضع webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف مشكلات القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات وخطط إصلاح عبر القنوات.
  </Card>
  <Card title="تكوين Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لتكوين القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز bot في BotFather">
    افتح Telegram وتحدث مع **@BotFather** (تأكد من أن المعرّف هو تمامًا `@BotFather`).

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

    بديل Env: `TELEGRAM_BOT_TOKEN=...` (الحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ كوّن الرمز في config/env، ثم ابدأ gateway.

  </Step>

  <Step title="ابدأ gateway ووافق على أول رسالة مباشرة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف bot إلى مجموعة">
    أضف bot إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يطابق نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب حلّ الرموز يراعي الحساب. عمليًا، قيم config تتغلب على بديل env، و`TELEGRAM_BOT_TOKEN` ينطبق فقط على الحساب الافتراضي.
</Note>

## إعدادات جانب Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية وظهور المجموعات">
    تستخدم bots في Telegram افتراضيًا **Privacy Mode**، ما يحدّ من رسائل المجموعة التي تتلقاها.

    إذا كان يجب أن يرى bot كل رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل bot مشرفًا في المجموعة.

    عند تبديل وضع الخصوصية، أزل bot ثم أعد إضافته في كل مجموعة حتى يطبّق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    تُدار حالة المشرف من إعدادات مجموعة Telegram.

    تتلقى bots المشرفة كل رسائل المجموعة، وهذا مفيد لسلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="مفاتيح BotFather مفيدة">

    - `/setjoingroups` للسماح بإضافات المجموعات أو منعها
    - `/setprivacy` لسلوك ظهور المجموعات

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

    يتيح `dmPolicy: "open"` مع `allowFrom: ["*"]` لأي حساب Telegram يعثر على اسم مستخدم bot أو يخمّنه أن يأمر bot. استخدمه فقط مع bots العامة عمدًا ذات الأدوات المقيّدة بإحكام؛ يجب أن تستخدم bots ذات المالك الواحد `allowlist` مع معرّفات المستخدمين الرقمية.

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. تُقبل بادئات `telegram:` / `tg:` وتُطبّع.
    في تكوينات متعددة الحسابات، يُعامل `channels.telegram.allowFrom` المقيّد في المستوى الأعلى كحد أمان: لا تجعل إدخالات `allowFrom: ["*"]` على مستوى الحساب ذلك الحساب عامًا ما لم تظل قائمة السماح الفعالة للحساب تتضمن حرف بدل صريحًا بعد الدمج.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغ كل الرسائل المباشرة، ويرفضه تحقق config.
    يطلب الإعداد معرّفات مستخدمين رقمية فقط.
    إذا قمت بالترقية وكان config لديك يحتوي على إدخالات قائمة سماح `@username`، فشغّل `openclaw doctor --fix` لحلّها (أفضل جهد؛ يتطلب رمز Telegram bot).
    إذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، فيمكن لـ `openclaw doctor --fix` استرداد الإدخالات إلى `channels.telegram.allowFrom` في تدفقات allowlist (مثلًا عندما لا يحتوي `dmPolicy: "allowlist"` على معرّفات صريحة بعد).

    بالنسبة إلى bots ذات المالك الواحد، فضّل `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة لإبقاء سياسة الوصول ثابتة في config (بدلًا من الاعتماد على موافقات اقتران سابقة).

    لبس شائع: موافقة اقتران الرسائل المباشرة لا تعني "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران وصول الرسائل المباشرة. إذا لم يكن يوجد مالك أوامر بعد، فإن أول اقتران معتمد يضبط أيضًا `commands.ownerAllowFrom` حتى يكون لأوامر المالك فقط وموافقات exec حساب مشغّل صريح.
    ما يزال تخويل مرسل المجموعة يأتي من قوائم السماح الصريحة في config.
    إذا أردت "أنا مخوّل مرة واحدة وتعمل الرسائل المباشرة وأوامر المجموعة معًا"، فضع معرّف مستخدم Telegram الرقمي في `channels.telegram.allowFrom`؛ ولأوامر المالك فقط، تأكد من أن `commands.ownerAllowFrom` يحتوي على `telegram:<your user id>`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    أكثر أمانًا (بدون bot تابع لجهة خارجية):

    1. أرسل رسالة مباشرة إلى bot الخاص بك.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة طرف ثالث (أقل خصوصية): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    ينطبق عنصران تحكمان معًا:

    1. **أي المجموعات مسموح بها** (`channels.telegram.groups`)
       - لا يوجد config لـ `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات `groups` (أو `"*"`)
       - تم تكوين `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح لهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (الافتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعة. إذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (تُطبّع بادئات `telegram:` / `tg:`).
    لا تضع معرّفات دردشة مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. مكان معرّفات الدردشة السالبة هو ضمن `channels.telegram.groups`.
    تُتجاهل الإدخالات غير الرقمية لتخويل المرسل.
    حد الأمان (`2026.2.25+`): تخويل مرسل المجموعة لا يرث موافقات مخزن اقتران الرسائل المباشرة.
    يبقى الاقتران خاصًا بالرسائل المباشرة فقط. بالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/موضوع.
    إذا لم يُضبط `groupAllowFrom`، يعود Telegram إلى `allowFrom` في config، وليس إلى مخزن الاقتران.
    النمط العملي لـ bots ذات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح بالمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا تمامًا، تكون افتراضيات وقت التشغيل fail-closed إلى `groupPolicy="allowlist"` ما لم يُضبط `channels.defaults.groupPolicy` صراحة.

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
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تحديد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل bot.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى bot.

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

    الحصول على معرّف دردشة المجموعة:

    - أعد توجيه رسالة مجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص Bot API `getUpdates`

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- يملك عملية gateway Telegram.
- التوجيه حتمي: ترد الرسائل الواردة من Telegram إلى Telegram (لا يختار النموذج القنوات).
- تُطبّع الرسائل الواردة إلى مغلف القناة المشترك مع بيانات التعريف للرد وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. تضيف مواضيع المنتدى `:topic:<threadId>` لإبقاء المواضيع معزولة.
- يمكن أن تحمل رسائل الرسائل المباشرة `message_thread_id`؛ يحافظ OpenClaw على معرّف السلسلة للردود لكنه يبقي الرسائل المباشرة على الجلسة المسطحة افتراضيًا. كوّن `channels.telegram.dm.threadReplies: "inbound"` أو `channels.telegram.direct.<chatId>.threadReplies: "inbound"` أو `requireTopic: true` أو config موضوعًا مطابقًا عندما تريد عمدًا عزل جلسات مواضيع الرسائل المباشرة.
- يستخدم Long polling مشغّل grammY مع تسلسل لكل دردشة/كل سلسلة. يستخدم تزامن حوض المشغّل العام `agents.defaults.maxConcurrent`.
- يُحمى Long polling داخل كل عملية gateway بحيث يمكن لمستطلع نشط واحد فقط استخدام رمز bot في الوقت نفسه. إذا كنت ما تزال ترى تعارضات `getUpdates` 409، فمن المحتمل أن gateway آخر من OpenClaw أو سكربتًا أو مستطلعًا خارجيًا يستخدم الرمز نفسه.
- تبدأ إعادة تشغيل مراقب Long-polling افتراضيًا بعد 120 ثانية بدون اكتمال نبض حياة `getUpdates`. زِد `channels.telegram.pollingStallThresholdMs` فقط إذا كان نشرُك ما يزال يرى عمليات إعادة تشغيل كاذبة بسبب توقف الاستطلاع أثناء عمل طويل. القيمة بالمللي ثانية ومسموح بها من `30000` إلى `600000`؛ وتُدعم التجاوزات لكل حساب.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يستطيع OpenClaw بث الردود الجزئية في الوقت الحقيقي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/المواضيع: رسالة معاينة + `editMessageText`

    المتطلب:

    - `channels.telegram.streaming` هو `off | partial | block | progress` (الافتراضي: `partial`)
    - يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير ويحدّثها بتقدم الأداة حتى التسليم النهائي
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة المعدلة نفسها (الافتراضي: `true` عندما يكون بث المعاينة نشطًا)
    - يتحكم `streaming.preview.commandText` في تفاصيل الأمر/exec داخل أسطر تقدم الأداة تلك: `raw` (الافتراضي، يحافظ على السلوك الصادر) أو `status` (تسمية الأداة فقط)
    - تُكتشف `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأداة هي أسطر الحالة القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر، وقراءات الملفات، وتحديثات التخطيط، أو ملخصات التصحيحات. يبقيها Telegram مفعّلة افتراضيًا لمطابقة سلوك OpenClaw الصادر من `v2026.4.22` وما بعده. للإبقاء على المعاينة المعدلة لنص الإجابة مع إخفاء أسطر تقدم الأداة، اضبط:

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

    للإبقاء على تقدم الأداة ظاهرًا مع إخفاء نص الأمر/exec، اضبط:

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

    بالنسبة إلى وضع مسودة التقدم، ضع سياسة نص الأمر نفسها ضمن `streaming.progress`:

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

    استخدم `streaming.mode: "off"` فقط عندما تريد تسليم النتيجة النهائية فقط: تُعطَّل تعديلات المعاينة في Telegram، ويُكبت حديث الأدوات/التقدم العام بدلًا من إرساله كرسائل حالة مستقلة. تظل مطالبات الموافقة، وحمولات الوسائط، والأخطاء تمر عبر التسليم النهائي المعتاد. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط إبقاء تعديلات معاينة الإجابة مع إخفاء أسطر حالة تقدم الأدوات.

    <Note>
      ردود الاقتباس المحدد في Telegram هي الاستثناء. عندما يكون `replyToMode` هو `"first"` أو `"all"` أو `"batched"` وتتضمن الرسالة الواردة نص اقتباس محددًا، يرسل OpenClaw الإجابة النهائية عبر مسار رد الاقتباس الأصلي في Telegram بدلًا من تعديل معاينة الإجابة، لذلك لا يمكن لـ `streaming.preview.toolProgress` إظهار أسطر الحالة القصيرة لذلك الدور. ما تزال الردود على الرسالة الحالية دون نص اقتباس محدد تحافظ على بث المعاينة. اضبط `replyToMode: "off"` عندما تكون رؤية تقدم الأدوات أهم من ردود الاقتباس الأصلية، أو اضبط `streaming.preview.toolProgress: false` للإقرار بهذه المفاضلة.
    </Note>

    للردود النصية فقط:

    - معاينات الرسائل الخاصة/المجموعات/المواضيع القصيرة: يحافظ OpenClaw على رسالة المعاينة نفسها وينفذ تعديلًا نهائيًا في المكان نفسه، ما لم تُرسل رسالة مرئية غير معاينة بعد ظهور المعاينة
    - المعاينات التي يتبعها إخراج مرئي غير معاينة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة وينظف المعاينة الأقدم، بحيث تظهر الإجابة النهائية بعد الإخراج الوسيط
    - المعاينات الأقدم من نحو دقيقة واحدة: يرسل OpenClaw الرد المكتمل كرسالة نهائية جديدة ثم ينظف المعاينة، بحيث يعكس الطابع الزمني المرئي في Telegram وقت الاكتمال بدلًا من وقت إنشاء المعاينة

    للردود المعقدة، مثل حمولات الوسائط، يعود OpenClaw إلى التسليم النهائي المعتاد ثم ينظف رسالة المعاينة.

    بث المعاينة منفصل عن بث الكتل. عندما يُفعَّل بث الكتل صراحةً لـ Telegram، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

    تدفق الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة الحية أثناء التوليد
    - تُحذف معاينة الاستدلال بعد التسليم النهائي؛ استخدم `/reasoning on` عندما ينبغي أن يبقى الاستدلال مرئيًا
    - تُرسل الإجابة النهائية دون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق والرجوع الاحتياطي إلى HTML">
    يستخدم النص الصادر في Telegram ‏`parse_mode: "HTML"`.

    - يُعرَض النص الشبيه بـ Markdown على هيئة HTML آمن لـ Telegram.
    - يُهرَّب HTML الخام الصادر من النموذج لتقليل إخفاقات التحليل في Telegram.
    - إذا رفض Telegram ‏HTML المحلَّل، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    يُعالَج تسجيل قائمة أوامر Telegram عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

    - يفعّل `commands.native: "auto"` الأوامر الأصلية لـ Telegram

    أضف إدخالات أوامر مخصصة إلى القائمة:

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

    - تُطبَّع الأسماء بإزالة `/` البادئة وتحويلها إلى أحرف صغيرة
    - النمط الصالح: `a-z`، و`0-9`، و`_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - تُتجاوز التعارضات/التكرارات وتُسجَّل

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن لأوامر Plugin/Skills أن تظل عاملة عند كتابتها حتى إن لم تظهر في قائمة Telegram

    إذا كانت الأوامر الأصلية معطلة، فتُزال الأوامر المضمنة. وقد تظل أوامر مخصصة/Plugin قادرة على التسجيل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما تزال متجاوزة للحد بعد التشذيب؛ قلل أوامر Plugin/Skills/المخصصة أو عطّل `channels.telegram.commands.native`.
    - قد يعني فشل `deleteWebhook` أو `deleteMyCommands` أو `setMyCommands` مع `404: Not Found` بينما تعمل أوامر curl المباشرة لـ Bot API أن `channels.telegram.apiRoot` قد ضُبط على نقطة النهاية الكاملة `/bot<TOKEN>`. يجب أن يكون `apiRoot` جذر Bot API فقط، ويزيل `openclaw doctor --fix` اللاحقة العرضية `/bot<TOKEN>`.
    - يعني `getMe returned 401` أن Telegram رفض رمز البوت المهيأ. حدّث `botToken` أو `tokenFile` أو `TELEGRAM_BOT_TOKEN` برمز BotFather الحالي؛ يتوقف OpenClaw قبل الاستقصاء، لذلك لا يُبلَّغ عن ذلك كفشل في تنظيف Webhook.
    - يعني `setMyCommands failed` مع أخطاء الشبكة/الجلب عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محظور.

    ### أوامر إقران الأجهزة (Plugin ‏`device-pair`)

    عند تثبيت Plugin ‏`device-pair`:

    1. يولّد `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يعرض `/pair pending` الطلبات المعلقة، بما في ذلك الدور/النطاقات
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` للأحدث

    يحمل رمز الإعداد رمز تمهيد قصير العمر. يحافظ التسليم التمهيدي المضمن على رمز العقدة الأساسية عند `scopes: []`؛ وأي رمز مشغّل مُسلَّم يبقى محدودًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. تكون فحوصات نطاق التمهيد مسبوقة بالدور، لذلك لا تلبي قائمة السماح للمشغّل إلا طلبات المشغّل؛ وما تزال الأدوار غير المشغّلة تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    إذا أعاد جهاز المحاولة مع تفاصيل مصادقة متغيرة، مثل الدور/النطاقات/المفتاح العام، يُستبدل الطلب المعلق السابق ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

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

    يُحوَّل `capabilities: ["inlineButtons"]` القديم إلى `inlineButtons: "all"`.

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

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أدوات Telegram ما يلي:

    - `sendMessage` (`to`، `content`، و`mediaUrl` اختياري، و`replyToMessageId`، و`messageThreadId`)
    - `react` (`chatId`، و`messageId`، و`emoji`)
    - `deleteMessage` (`chatId`، و`messageId`)
    - `editMessage` (`chatId`، و`messageId`، و`content`)
    - `createForumTopic` (`chatId`، و`name`، و`iconColor` اختياري، و`iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماء بديلة مريحة (`send`، و`react`، و`delete`، و`edit`، و`sticker`، و`sticker-search`، و`topic-create`).

    عناصر التحكم في الحجب:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (افتراضي: معطل)

    ملاحظة: `edit` و`topic-create` مفعّلان حاليًا افتراضيًا ولا يملكان مفاتيح تبديل منفصلة ضمن `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل لقطة التهيئة/الأسرار النشطة عند بدء التشغيل/إعادة التحميل، لذلك لا تنفذ مسارات الإجراء إعادة حل SecretRef مخصصة لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تسلسل الردود">
    يدعم Telegram وسوم تسلسل ردود صريحة في الإخراج المولّد:

    - يرد `[[reply_to_current]]` على الرسالة المحفزة
    - يرد `[[reply_to:<id>]]` على معرّف رسالة Telegram محددة

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    عندما يكون تسلسل الردود مفعّلًا ويكون نص Telegram الأصلي أو التعليق متاحًا، يضمن OpenClaw مقتطف اقتباس أصليًا من Telegram تلقائيًا. يحد Telegram نص الاقتباس الأصلي عند 1024 وحدة ترميز UTF-16، لذلك تُقتبس الرسائل الأطول من البداية وتعود إلى رد عادي إذا رفض Telegram الاقتباس.

    ملاحظة: يعطّل `off` تسلسل الردود الضمني. ما تزال وسوم `[[reply_to_*]]` الصريحة محترمة.

  </Accordion>

  <Accordion title="مواضيع المنتدى وسلوك السلاسل">
    المجموعات الفائقة ذات المنتديات:

    - تضيف مفاتيح جلسات المواضيع `:topic:<threadId>`
    - تستهدف الردود وإجراءات الكتابة سلسلة الموضوع
    - مسار تهيئة الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    حالة خاصة للموضوع العام (`threadId=1`):

    - تحذف عمليات إرسال الرسائل `message_thread_id`، إذ يرفض Telegram ‏`sendMessage(...thread_id=1)`
    - ما تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات المواضيع إعدادات المجموعة ما لم تُتجاوز (`requireMention`، و`allowFrom`، و`skills`، و`systemPrompt`، و`enabled`، و`groupPolicy`).
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

    **ربط موضوع ACP دائم**: يمكن لمواضيع المنتدى تثبيت جلسات حزمة ACP عبر روابط ACP مكتوبة على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بالموضوع مثل `-1001234567890:topic:42`). النطاق الحالي مقتصر على مواضيع المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالسلسلة من المحادثة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه المتابعات إليها مباشرةً. يثبت OpenClaw تأكيد الإنشاء داخل الموضوع. يتطلب بقاء `channels.telegram.threadBindings.spawnSessions` مفعّلًا (افتراضي: `true`).

    يوفّر سياق القالب `MessageThreadId` و`IsForum`. تحتفظ محادثات الرسائل المباشرة التي تتضمن `message_thread_id` بتوجيه الرسائل المباشرة وبيانات تعريف الرد في الجلسات المسطحة افتراضيًا؛ ولا تستخدم مفاتيح جلسات واعية بالسلاسل إلا عند تهيئتها باستخدام `threadReplies: "inbound"` أو `threadReplies: "always"` أو `requireTopic: true` أو تهيئة موضوع مطابقة. استخدم `channels.telegram.dm.threadReplies` على المستوى الأعلى للإعداد الافتراضي للحساب، أو `direct.<chatId>.threadReplies` لرسالة مباشرة واحدة.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية والملفات الصوتية.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية
    - تُؤطر تفريغات الملاحظات الصوتية الواردة كنص مولد آليًا
      وغير موثوق في سياق الوكيل؛ لا يزال اكتشاف الإشارة يستخدم التفريغ
      الخام، لذلك تستمر رسائل الصوت المقيدة بالإشارات في العمل.

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

    - WEBP ثابت: يُنزّل ويُعالج (العنصر النائب `<media:sticker>`)
    - TGS متحرك: يُتجاوز
    - WEBM فيديو: يُتجاوز

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة التخزين المؤقت للملصقات:

    - `~/.openclaw/telegram/sticker-cache.json`

    تُوصف الملصقات مرة واحدة (عند الإمكان) وتُخزن مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

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

    إرسال إجراء ملصق:

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

    عند التفعيل، يضع OpenClaw أحداث نظام في الطابور مثل:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    التهيئة:

    - `channels.telegram.reactionNotifications`: `off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - `own` يعني تفاعلات المستخدم مع الرسائل المرسلة من البوت فقط (بأفضل جهد عبر ذاكرة الرسائل المرسلة المؤقتة).
    - لا تزال أحداث التفاعل تحترم ضوابط الوصول في Telegram (`dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`)؛ يُسقط المرسلون غير المصرح لهم.
    - لا يوفر Telegram معرفات السلاسل في تحديثات التفاعل.
      - تُوجّه المجموعات غير المنتدية إلى جلسة محادثة المجموعة
      - تُوجّه مجموعات المنتديات إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    يتضمن `allowed_updates` للاستقصاء/Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية Unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات التهيئة من أحداث وأوامر Telegram">
    تكون كتابات تهيئة القناة مفعلة افتراضيًا (`configWrites !== false`).

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

  <Accordion title="الاستقصاء الطويل مقابل Webhook">
    الافتراضي هو الاستقصاء الطويل. لوضع Webhook عيّن `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`؛ اختياريًا `webhookPath` و`webhookHost` و`webhookPort` (القيم الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    يربط المستمع المحلي على `127.0.0.1:8787`. للدخول العام، إما ضع وكيلاً عكسيًا أمام المنفذ المحلي أو عيّن `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حواجز الطلبات، والرمز السري لـ Telegram، وجسم JSON قبل إعادة `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات البوت نفسها لكل محادثة/لكل موضوع المستخدمة في الاستقصاء الطويل، لذلك لا تُبقي دورات الوكيل البطيئة إقرار التسليم من Telegram قيد الانتظار.

  </Accordion>

  <Accordion title="الحدود وإعادة المحاولة وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يضع `channels.telegram.mediaMaxMb` (الافتراضي 100) حدًا لحجم وسائط Telegram الواردة والصادرة.
    - يتحكم `channels.telegram.mediaGroupFlushMs` (الافتراضي 500) في مدة تخزين ألبومات/مجموعات وسائط Telegram مؤقتًا قبل أن يرسلها OpenClaw كرسالة واردة واحدة. زدها إذا وصلت أجزاء الألبوم متأخرة؛ وقللها لتقليل زمن استجابة رد الألبوم.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل Telegram API (إذا لم تُعيّن، تُطبق القيمة الافتراضية لـ grammY). يثبت عملاء البوت القيم المهيأة الأقل من حاجز طلب النص/الكتابة الصادر البالغ 60 ثانية حتى لا يجهض grammY تسليم الرد المرئي قبل أن يعمل حاجز النقل والبديل في OpenClaw. لا يزال الاستقصاء الطويل يستخدم حاجز طلب `getUpdates` مدته 45 ثانية حتى لا تُترك الاستقصاءات الخاملة إلى أجل غير مسمى.
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`؛ اضبطها بين `30000` و`600000` فقط لحالات إعادة تشغيل توقف الاستقصاء الإيجابية الكاذبة.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50)؛ يعطله `0`.
    - يُمرر السياق التكميلي للرد/الاقتباس/إعادة التوجيه حاليًا كما ورد.
    - تتحكم قوائم السماح في Telegram أساسًا في من يمكنه تشغيل الوكيل، وليست حدًا كاملاً لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل الرسائل المباشرة:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - تنطبق تهيئة `channels.telegram.retry` على مساعدات إرسال Telegram (CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد. يستخدم تسليم الرد النهائي الوارد أيضًا إعادة محاولة محدودة للإرسال الآمن عند إخفاقات Telegram قبل الاتصال، لكنه لا يعيد محاولة أظرف الشبكة الغامضة بعد الإرسال التي قد تكرر الرسائل المرئية.

    يمكن أن يكون هدف إرسال CLI معرف محادثة رقميًا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
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
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يستطيع البوت التثبيت في تلك المحادثة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من تحميلات الصور المضغوطة أو الوسائط المتحركة

    تقييد الإجراءات:

    - `channels.telegram.actions.sendMessage=false` يعطل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - `channels.telegram.actions.poll=false` يعطل إنشاء استطلاعات Telegram مع إبقاء الإرسالات العادية مفعلة

  </Accordion>

  <Accordion title="موافقات التنفيذ في Telegram">
    يدعم Telegram موافقات التنفيذ في الرسائل المباشرة للموافقين، ويمكنه اختياريًا نشر المطالبات في المحادثة أو الموضوع الأصلي. يجب أن يكون الموافقون معرفات مستخدمي Telegram رقمية.

    مسار التهيئة:

    - `channels.telegram.execApprovals.enabled` (يُفعّل تلقائيًا عند إمكانية حل موافق واحد على الأقل)
    - `channels.telegram.execApprovals.approvers` (يرجع إلى معرفات المالك الرقمية من `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (الافتراضي) | `channel` | `both`
    - `agentFilter`، `sessionFilter`

    تتحكم `channels.telegram.allowFrom` و`groupAllowFrom` و`defaultTo` في من يمكنه التحدث إلى البوت وأين يرسل الردود العادية. وهي لا تجعل شخصًا ما موافقًا على التنفيذ. يهيئ أول اقتران رسالة مباشرة معتمد `commands.ownerAllowFrom` عندما لا يوجد مالك أوامر بعد، لذلك لا يزال إعداد المالك الواحد يعمل دون تكرار المعرفات ضمن `execApprovals.approvers`.

    يعرض تسليم القناة نص الأمر في المحادثة؛ لا تفعّل `channel` أو `both` إلا في المجموعات/المواضيع الموثوقة. عندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة والمتابعة. تنتهي صلاحية موافقات التنفيذ بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح الهدف (`dm` أو `group` أو `all`). تُحل معرفات الموافقة التي تبدأ بـ `plugin:` عبر موافقات Plugin؛ وتُحل الأخرى عبر موافقات التنفيذ أولًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزوّد، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا تهيئة في هذا السلوك:

| المفتاح                            | القيم             | الافتراضي | الوصف                                                                                         |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | يرسل `reply` رسالة خطأ ودية إلى المحادثة. يكتم `silent` ردود الأخطاء بالكامل.                  |
| `channels.telegram.errorCooldownMs` | رقم (مللي ثانية)  | `60000` | الحد الأدنى للوقت بين ردود الأخطاء إلى المحادثة نفسها. يمنع الرسائل المزعجة للأخطاء أثناء الانقطاعات. |

تُدعم التجاوزات لكل حساب ولكل مجموعة ولكل موضوع (بالوراثة نفسها مثل مفاتيح تهيئة Telegram الأخرى).

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
  <Accordion title="لا يستجيب البوت لرسائل المجموعة من دون إشارة">

    - إذا كانت `requireMention=false`، يجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: `/setprivacy` -> Disable
      - ثم أزل البوت وأعد إضافته إلى المجموعة
    - يحذر `openclaw channels status` عندما تتوقع التهيئة رسائل مجموعة من دون إشارات.
    - يمكن لـ `openclaw channels status --probe` التحقق من معرفات المجموعات الرقمية الصريحة؛ لا يمكن فحص العضوية للبدل العام `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="البوت لا يرى رسائل المجموعة إطلاقًا">

    - عندما يوجد `channels.telegram.groups`، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقّق من عضوية البوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التجاوز

  </Accordion>

  <Accordion title="تعمل الأوامر جزئياً أو لا تعمل إطلاقاً">

    - فوّض هوية المُرسِل لديك (الإقران و/أو `allowFrom` الرقمي)
    - يظل تفويض الأوامر سارياً حتى عندما تكون سياسة المجموعة `open`
    - يعني فشل `setMyCommands` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جداً من الإدخالات؛ قلّل أوامر Plugin/Skills/المخصصة أو عطّل القوائم الأصلية
    - استدعاءات بدء التشغيل `deleteMyCommands` / `setMyCommands` واستدعاءات إظهار الكتابة `sendChatAction` محدودة وتُعاد مرة واحدة عبر مسار نقل Telegram الاحتياطي عند انتهاء مهلة الطلب. تشير أخطاء الشبكة/الجلب المستمرة عادةً إلى مشكلات في قابلية الوصول إلى DNS/HTTPS نحو `api.telegram.org`

  </Accordion>

  <Accordion title="يبلغ بدء التشغيل عن رمز مميز غير مصرّح به">

    - `getMe returned 401` هو فشل مصادقة من Telegram لرمز البوت المكوّن.
    - انسخ رمز البوت مجدداً أو أعد توليده في BotFather، ثم حدّث `channels.telegram.botToken` أو `channels.telegram.tokenFile` أو `channels.telegram.accounts.<id>.botToken` أو `TELEGRAM_BOT_TOKEN` للحساب الافتراضي.
    - `deleteWebhook 401 Unauthorized` أثناء بدء التشغيل هو أيضاً فشل مصادقة؛ التعامل معه على أنه "لا يوجد Webhook" لن يؤدي إلا إلى تأجيل فشل الرمز السيئ نفسه إلى استدعاءات API اللاحقة.

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - يمكن أن يؤدي Node 22+ مع جلب/وكيل مخصص إلى سلوك إجهاض فوري إذا كانت أنواع AbortSignal غير متطابقة.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولاً؛ وقد يتسبب خروج IPv6 المعطّل في إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الأخطاء كأخطاء شبكة قابلة للاسترداد.
    - أثناء بدء تشغيل الاستطلاع، يعيد OpenClaw استخدام فحص بدء التشغيل الناجح `getMe` مع grammY بحيث لا يحتاج المشغّل إلى `getMe` ثانٍ قبل أول `getUpdates`.
    - إذا فشل `deleteWebhook` بسبب خطأ شبكة عابر أثناء بدء تشغيل الاستطلاع، يواصل OpenClaw إلى الاستطلاع الطويل بدلاً من إجراء استدعاء آخر لمستوى التحكم قبل الاستطلاع. يظهر Webhook الذي لا يزال نشطاً كتعارض في `getUpdates`؛ ثم يعيد OpenClaw بناء نقل Telegram ويحاول تنظيف Webhook مجدداً.
    - إذا كانت مقابس Telegram تُعاد تدويرها بوتيرة ثابتة قصيرة، فتحقق من انخفاض `channels.telegram.timeoutSeconds`؛ يقيّد عملاء البوت القيم المكوّنة التي تقل عن حواجز طلبات الخروج و`getUpdates`، لكن الإصدارات الأقدم كان يمكن أن تُجهض كل استطلاع أو رد عند ضبطها دون تلك الحواجز.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية دون اكتمال حيوية الاستطلاع الطويل افتراضياً.
    - يحذّر `openclaw channels status --probe` و`openclaw doctor` عندما لا يكون حساب استطلاع قيد التشغيل قد أكمل `getUpdates` بعد فترة السماح عند بدء التشغيل، أو عندما لا يكون حساب Webhook قيد التشغيل قد أكمل `setWebhook` بعد فترة السماح عند بدء التشغيل، أو عندما يكون آخر نشاط ناجح لنقل الاستطلاع قديماً.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` طويلة التشغيل سليمة لكن مضيفك لا يزال يبلغ خطأً عن إعادة تشغيل بسبب توقف الاستطلاع. تشير حالات التوقف المستمرة عادةً إلى مشكلات وكيل أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - يحترم Telegram أيضاً متغيرات بيئة وكيل العملية لنقل Bot API، بما في ذلك `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` وصيغها بالأحرف الصغيرة. لا يزال بإمكان `NO_PROXY` / `no_proxy` تجاوز `api.telegram.org`.
    - إذا كان وكيل OpenClaw المُدار مكوّناً عبر `OPENCLAW_PROXY_URL` لبيئة خدمة ولا توجد متغيرات بيئة وكيل قياسية، يستخدم Telegram ذلك URL لنقل Bot API أيضاً.
    - على مضيفات VPS ذات خروج مباشر/TLS غير مستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يضبط Node 22+ افتراضياً `autoSelectFamily=true` (باستثناء WSL2). يحترم ترتيب نتائج DNS في Telegram `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`، ثم `channels.telegram.network.dnsResultOrder`، ثم افتراضي العملية مثل `NODE_OPTIONS=--dns-result-order=ipv4first`؛ إذا لم ينطبق أي منها، يعود Node 22+ إلى `ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحةً بشكل أفضل بسلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إجابات نطاق القياس المعياري RFC 2544 (`198.18.0.0/15`) مسموح بها بالفعل
      لتنزيلات وسائط Telegram افتراضياً. إذا أعاد وكيل fake-IP موثوق أو
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
    - إذا كان وكيلك يحل مضيفات وسائط Telegram إلى `198.18.x.x`، فاترك
      العلم الخطر معطلاً أولاً. تسمح وسائط Telegram بالفعل بنطاق القياس
      المعياري RFC 2544 افتراضياً.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` وسائل حماية SSRF
      لوسائط Telegram. استخدمه فقط لبيئات الوكيل الموثوقة التي يتحكم بها المشغّل
      مثل توجيه fake-IP في Clash أو Mihomo أو Surge عندما تُنشئ
      إجابات خاصة أو ذات استخدام خاص خارج نطاق القياس المعياري RFC 2544.
      اتركه معطلاً للوصول العادي إلى Telegram عبر الإنترنت العام.
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

مزيد من المساعدة: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الإشارة">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ تُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات التنفيذ: `execApprovals`, `accounts.*.execApprovals`
- الأمر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- الترابط/الردود: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- البث: `streaming` (معاينة), `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- جذر API مخصص: `apiRoot` (جذر Bot API فقط؛ لا تضمّن `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/القدرات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أسبقية الحسابات المتعددة: عند تكوين معرّفَي حساب أو أكثر، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحاً. وإلا يعود OpenClaw إلى أول معرّف حساب مُطبّع ويحذّر `openclaw doctor`. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    أقرن مستخدم Telegram بـ Gateway.
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
  <Card title="توجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط المجموعات والمواضيع بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات.
  </Card>
</CardGroup>
