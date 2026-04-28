---
read_when:
    - العمل على سلوك WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T11:24:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd4217adb673bc4c071fc1bff6994fb214966c2b28fe59253a1a6f4b4b7fcdba
    source_path: channels/whatsapp.md
    workflow: 15
---

الحالة: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). يملك Gateway الجلسة (أو الجلسات) المرتبطة.

## التثبيت (عند الطلب)

- يطلب الإعداد الأوّلي (`openclaw onboard`) والأمر `openclaw channels add --channel whatsapp`
  تثبيت Plugin الخاص بـ WhatsApp في أول مرة تختاره فيها.
- يوفّر `openclaw channels login --channel whatsapp` أيضًا تدفق التثبيت عندما
  لا يكون الـ Plugin موجودًا بعد.
- قناة التطوير + نسخة git checkout: تستخدم افتراضيًا مسار الـ Plugin المحلي.
- Stable/Beta: تستخدم افتراضيًا حزمة npm ‏`@openclaw/whatsapp`.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة الافتراضية للمرسلين غير المعروفين هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة الإصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعدادات القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="تهيئة سياسة وصول WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="ربط WhatsApp ‏(QR)">

```bash
openclaw channels login --channel whatsapp
```

    لحساب محدد:

```bash
openclaw channels login --channel whatsapp --account work
```

    لإرفاق دليل مصادقة WhatsApp Web موجود/مخصص قبل تسجيل الدخول:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="ابدأ gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="اعتمد أول طلب اقتران (إذا كنت تستخدم وضع الاقتران)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. ويكون الحد الأقصى للطلبات المعلقة 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل متى أمكن. (بيانات القناة الوصفية وتدفق الإعداد محسّنان لهذا الإعداد، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو النمط التشغيلي الأكثر نظافة:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - حدود أوضح لقوائم السماح في الرسائل الخاصة ومسارات التوجيه
    - احتمال أقل للالتباس في الدردشة الذاتية

    نمط السياسة الأدنى:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="بديل الرقم الشخصي">
    يدعم الإعداد الأوّلي وضع الرقم الشخصي ويكتب خط أساس مناسبًا للدردشة الذاتية:

    - `dmPolicy: "allowlist"`
    - تتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تعتمد وسائل حماية الدردشة الذاتية على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة تعتمد على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة WhatsApp منفصلة عبر Twilio في سجل قنوات الدردشة المضمّن.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يملك Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- تتطلب الرسائل الصادرة وجود مستمع WhatsApp نشط للحساب المستهدف.
- يتم تجاهل دردشات الحالة والبث (`@status` و`@broadcast`).
- تستخدم الدردشات المباشرة قواعد جلسات الرسائل الخاصة (`session.dmScope`؛ الافتراضي `main` يدمج الرسائل الخاصة في الجلسة الرئيسية للوكيل).
- تكون جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يحترم نقل WhatsApp Web متغيرات بيئة proxy القياسية على مضيف gateway (`HTTPS_PROXY` و`HTTP_PROXY` و`NO_PROXY` / وصيغها بالأحرف الصغيرة). يُفضَّل إعداد proxy على مستوى المضيف بدلًا من إعدادات proxy خاصة بـ WhatsApp على مستوى القناة.
- عند تفعيل `messages.removeAckAfterReply`، يزيل OpenClaw تفاعل الإقرار في WhatsApp بعد تسليم رد مرئي.

## خطافات Plugin والخصوصية

قد تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية، وأرقام هواتف،
ومعرفات مجموعات، وأسماء مرسلين، وحقول ربط الجلسات. ولهذا السبب،
لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى Plugins
ما لم تقم أنت بتفعيل ذلك صراحةً:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

يمكنك حصر التفعيل في حساب واحد:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

فعّل هذا فقط للـ Plugins التي تثق بها لتلقي محتوى رسائل WhatsApp
الواردة والمعرفات الخاصة بها.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى الدردشة المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    تقبل `allowFrom` أرقامًا بنمط E.164 (مع تطبيع داخلي).

    تجاوزات تعدد الحسابات: تأخذ `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) الأولوية على الإعدادات الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفَظ طلبات الاقتران في مخزن السماح الخاص بالقناة وتُدمج مع `allowFrom` المهيأة
    - إذا لم تكن هناك قائمة سماح مهيأة، يُسمح بالرقم الذاتي المرتبط افتراضيًا
    - لا يُنشئ OpenClaw اقترانًا تلقائيًا أبدًا لرسائل `fromMe` الخاصة الصادرة (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    يتكون الوصول إلى المجموعات من طبقتين:

    1. **قائمة سماح عضوية المجموعات** (`channels.whatsapp.groups`)
       - إذا تم حذف `groups`، تكون كل المجموعات مؤهلة
       - إذا وُجدت `groups`، فإنها تعمل كقائمة سماح للمجموعات (مع السماح بـ `"*"`)

    2. **سياسة مرسلي المجموعات** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتم تجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الرسائل الواردة من المجموعات

    الرجوع في قائمة سماح المرسلين:

    - إذا لم يتم ضبط `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفره
    - تُقيَّم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم يوجد أي قسم `channels.whatsapp` أصلًا، فإن الرجوع في سياسة المجموعات وقت التشغيل يكون `allowlist` (مع سجل تحذير)، حتى لو تم ضبط `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب الردود في المجموعات الإشارة افتراضيًا.

    يشمل اكتشاف الإشارة ما يلي:

    - إشارات WhatsApp صريحة لهوية البوت
    - أنماط regex المهيأة للإشارة (`agents.list[].groupChat.mentionPatterns`، والرجوع إلى `messages.groupChat.mentionPatterns`)
    - نصوص تفريغ الملاحظات الصوتية الواردة لرسائل المجموعات المصرح بها
    - الاكتشاف الضمني للرد على البوت (مرسل الرد يطابق هوية البوت)

    ملاحظة أمنية:

    - الاقتباس/الرد يحقق فقط شرط الإشارة؛ لكنه **لا** يمنح تفويضًا للمرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير الموجودين في قائمة السماح محظورين حتى إذا ردوا على رسالة من مستخدم موجود في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس الإعدادات العامة). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والدردشة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، يتم تفعيل وسائل الحماية الخاصة بالدردشة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لدورات الدردشة الذاتية
- تجاهل سلوك التشغيل التلقائي عبر mention-JID الذي قد يؤدي بخلاف ذلك إلى تنبيهك أنت نفسك
- إذا لم يتم ضبط `messages.responsePrefix`، فإن ردود الدردشة الذاتية تستخدم افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="غلاف الرسائل الواردة + سياق الرد">
    تُغلَّف رسائل WhatsApp الواردة داخل الغلاف المشترك للرسائل الواردة.

    إذا وُجد رد مقتبس، يُلحَق السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُعبَّأ أيضًا حقول البيانات الوصفية للرد عند توفرها (`ReplyToId` و`ReplyToBody` و`ReplyToSender` ومرسل JID/E.164).

  </Accordion>

  <Accordion title="عناصر الوسائط النائبة واستخراج الموقع/جهة الاتصال">
    تُطبَّع الرسائل الواردة التي تحتوي على وسائط فقط باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تُفرَّغ الملاحظات الصوتية المصرح بها في المجموعات إلى نص قبل بوابة الإشارة عندما
    يكون المتن هو فقط `<media:audio>`، لذلك فإن قول إشارة البوت داخل الملاحظة الصوتية قد
    يؤدي إلى تشغيل الرد. وإذا ظل التفريغ لا يذكر البوت، فسيُحفَظ
    التفريغ في سجل المجموعة المعلّق بدلًا من العنصر النائب الخام.

    تستخدم أجسام الموقع نص إحداثيات موجزًا. وتُعرَض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات وصفية غير موثوقة داخل أسوار نصية، وليس كنص Prompt مضمن.

  </Accordion>

  <Accordion title="حقن سجل المجموعة المعلّق">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يتم أخيرًا تشغيل البوت.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الرجوع: `messages.groupChat.historyLimit`
    - `0` يعطّل الميزة

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="إيصالات القراءة">
    تكون إيصالات القراءة مفعلة افتراضيًا لرسائل WhatsApp الواردة المقبولة.

    للتعطيل عالميًا:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    تجاوز لكل حساب:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    تتخطى دورات الدردشة الذاتية إيصالات القراءة حتى عند تفعيلها عالميًا.

  </Accordion>
</AccordionGroup>

## التسليم، والتجزئة، والوسائط

<AccordionGroup>
  <Accordion title="تجزئة النص">
    - الحد الافتراضي للتجزئة: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التجزئة الآمنة حسب الطول

  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور، والفيديو، والصوت (ملاحظة صوتية PTT)، والمستندات
    - تُرسَل الوسائط الصوتية عبر حمولة `audio` في Baileys مع `ptt: true`، لذلك تعرضها تطبيقات WhatsApp كملاحظة صوتية push-to-talk
    - تحافظ حمولات الرد على `audioAsVoice`؛ وتبقى مخرجات الملاحظات الصوتية عبر TTS في WhatsApp على مسار PTT هذا حتى عندما يعيد provider ملفات MP3 أو WebM
    - يُرسَل الصوت الأصلي Ogg/Opus كنوع `audio/ogg; codecs=opus` من أجل التوافق مع الملاحظات الصوتية
    - يُحوَّل الصوت غير Ogg، بما في ذلك مخرجات Microsoft Edge TTS بصيغة MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي القناة بتردد 48 كيلوهرتز قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد من المساعد كملاحظة صوتية واحدة ويمنع تكرار الإرسال للرد نفسه؛ ويتحكم `/tts chat on|off|default` في TTS التلقائي لدردشة WhatsApp الحالية
    - يدعم تشغيل GIF المتحرك عبر `gifPlayback: true` عند إرسال الفيديو
    - تُطبَّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط، باستثناء أن ملاحظات PTT الصوتية ترسل الصوت أولًا والنص المرئي بشكل منفصل لأن تطبيقات WhatsApp لا تعرض تسميات الملاحظات الصوتية بشكل متسق
    - يمكن أن يكون مصدر الوسائط HTTP(S) أو `file://` أو مسارات محلية

  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الرجوع">
    - الحد الأقصى لحفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - الحد الأقصى لإرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسَّن الصور تلقائيًا (إعادة تحجيم/تمرير على الجودة) لتلائم الحدود
    - عند فشل إرسال الوسائط، يرسل الرجوع الخاص بالعنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الرد

يدعم WhatsApp اقتباس الرد الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم في ذلك عبر `channels.whatsapp.replyToMode`.

| القيمة      | السلوك                                                               |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | لا يقتبس أبدًا؛ يُرسل كرسالة عادية                                   |
| `"first"`   | يقتبس أول جزء فقط من الرد الصادر                                     |
| `"all"`     | يقتبس كل جزء من أجزاء الرد الصادر                                    |
| `"batched"` | يقتبس الردود المجمعة في قائمة الانتظار ويترك الردود الفورية بلا اقتباس |

القيمة الافتراضية هي `"off"`. تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## مستوى التفاعلات

يتحكم `channels.whatsapp.reactionLevel` في مدى استخدام الوكيل لتفاعلات الإيموجي على WhatsApp:

| المستوى      | تفاعلات الإقرار | التفاعلات التي يبدأها الوكيل | الوصف                                               |
| ------------ | --------------- | ---------------------------- | --------------------------------------------------- |
| `"off"`      | لا              | لا                           | لا توجد أي تفاعلات                                  |
| `"ack"`      | نعم             | لا                           | تفاعلات الإقرار فقط (استلام ما قبل الرد)            |
| `"minimal"`  | نعم             | نعم (بتحفظ)                  | إقرار + تفاعلات الوكيل مع توجيه محافظ               |
| `"extensive"`| نعم             | نعم (مُشجَّعة)               | إقرار + تفاعلات الوكيل مع توجيه مشجَّع              |

الافتراضي: `"minimal"`.

تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## تفاعلات الإقرار

يدعم WhatsApp تفاعلات إقرار فورية عند استلام الرسائل الواردة عبر `channels.whatsapp.ackReaction`.
تكون تفاعلات الإقرار مقيّدة بواسطة `reactionLevel` — ويتم حجبها عندما تكون قيمة `reactionLevel` هي `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

ملاحظات السلوك:

- تُرسل فورًا بعد قبول الرسالة الواردة (قبل الرد)
- تُسجَّل الإخفاقات لكنها لا تمنع تسليم الرد العادي
- في وضع المجموعات `mentions`، يتم التفاعل في الدورات التي تُشغَّل بالإشارة؛ ويعمل تفعيل المجموعات `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp الإعداد `channels.whatsapp.ackReaction` (ولا يُستخدم هنا الإعداد القديم `messages.ackReaction`)

## تعدد الحسابات وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والقيم الافتراضية">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودًا، وإلا أول معرّف حساب مهيأ (بعد الفرز)
    - تُطبَّع معرّفات الحسابات داخليًا لأغراض البحث

  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق مع الإصدارات القديمة">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا يزال يتم التعرف على المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` وترحيلها لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يقوم `openclaw channels logout --channel whatsapp [--account <id>]` بمسح حالة مصادقة WhatsApp لذلك الحساب.

    في أدلة المصادقة القديمة، يتم الاحتفاظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات، والإجراءات، وكتابة الإعدادات

- يتضمن دعم أدوات الوكيل إجراء تفاعلات WhatsApp (`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تكون عمليات كتابة الإعدادات التي تبدأها القناة مفعلة افتراضيًا (يمكن تعطيلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (مطلوب QR)">
    العرض: تُظهر حالة القناة أنها غير مرتبطة.

    الحل:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكنه غير متصل / حلقة إعادة اتصال">
    العرض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    الحل:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    عند الحاجة، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل الإرسالات الصادرة سريعًا عندما لا يوجد مستمع gateway نشط للحساب المستهدف.

    تأكد من أن gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات بشكل غير متوقع">
    تحقّق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارة (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` ‏(JSON5): الإدخالات اللاحقة تتجاوز السابقة، لذا احتفظ بقيمة `groupPolicy` واحدة لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل gateway الخاص بـ WhatsApp بيئة Node. تُصنَّف Bun على أنها غير متوافقة مع التشغيل المستقر لـ gateway الخاص بـ WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## System prompts

يدعم WhatsApp أوامر System prompts على نمط Telegram للمجموعات والدردشات المباشرة عبر خرائط `groups` و`direct`.

تراتبية الحل لرسائل المجموعات:

يتم أولًا تحديد خريطة `groups` الفعالة: إذا كان الحساب يعرّف `groups` خاصة به، فإنها تستبدل خريطة `groups` الجذرية بالكامل (من دون دمج عميق). ثم يُجرى البحث عن prompt على الخريطة المفردة الناتجة:

1. **System prompt خاص بالمجموعة** (`groups["<groupId>"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحددة موجودًا في الخريطة **ويكون** مفتاح `systemPrompt` الخاص به معرّفًا. إذا كانت قيمة `systemPrompt` سلسلة فارغة (`""`) يتم حجب wildcard ولا يتم تطبيق أي system prompt.
2. **System prompt wildcard للمجموعة** (`groups["*"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف المفتاح `systemPrompt`.

تراتبية الحل للرسائل المباشرة:

يتم أولًا تحديد خريطة `direct` الفعالة: إذا كان الحساب يعرّف `direct` خاصة به، فإنها تستبدل خريطة `direct` الجذرية بالكامل (من دون دمج عميق). ثم يُجرى البحث عن prompt على الخريطة المفردة الناتجة:

1. **System prompt خاص بالمحادثة المباشرة** (`direct["<peerId>"].systemPrompt`): يُستخدم عندما يكون إدخال النظير المحدد موجودًا في الخريطة **ويكون** مفتاح `systemPrompt` الخاص به معرّفًا. إذا كانت قيمة `systemPrompt` سلسلة فارغة (`""`) يتم حجب wildcard ولا يتم تطبيق أي system prompt.
2. **System prompt wildcard للمحادثة المباشرة** (`direct["*"].systemPrompt`): يُستخدم عندما يكون إدخال النظير المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف المفتاح `systemPrompt`.

ملاحظة: يظل `dms` هو حاوية التجاوز الخفيفة لسجل كل رسالة خاصة (`dms.<id>.historyLimit`)؛ أما تجاوزات prompt فتوجد تحت `direct`.

**الاختلاف عن سلوك Telegram متعدد الحسابات:** في Telegram، يتم حجب `groups` الجذرية عمدًا عن جميع الحسابات في إعداد متعدد الحسابات — حتى الحسابات التي لا تعرّف `groups` خاصة بها — لمنع أحد البوتات من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبق WhatsApp هذا القيد: يتم دائمًا توريث `groups` الجذرية و`direct` الجذرية إلى الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المهيأة. في إعداد WhatsApp متعدد الحسابات، إذا كنت تريد prompts خاصة بالمجموعات أو الدردشات المباشرة لكل حساب، فعرّف الخريطة الكاملة تحت كل حساب صراحة بدلًا من الاعتماد على الإعدادات الافتراضية على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هي في الوقت نفسه خريطة إعدادات لكل مجموعة وقائمة سماح للمجموعات على مستوى الدردشة. سواء على مستوى الجذر أو الحساب، تعني `groups["*"]` أن "جميع المجموعات مسموح بها" في ذلك النطاق.
- لا تضف `systemPrompt` للمجموعات بصيغة wildcard إلا عندما تكون تريد بالفعل أن يسمح ذلك النطاق بجميع المجموعات. إذا كنت لا تزال تريد أن تظل فقط مجموعة ثابتة من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كإعداد افتراضي للـ prompt. بدلًا من ذلك، كرر الـ prompt في كل إدخال مجموعة موجود صراحة في قائمة السماح.
- قبول المجموعة وتفويض المرسل فحصان منفصلان. توسّع `groups["*"]` مجموعة المجموعات التي يمكن أن تصل إلى معالجة المجموعات، لكنها لا تفوض بحد ذاتها كل مرسل في تلك المجموعات. لا يزال الوصول للمرسلين محكومًا بشكل منفصل بواسطة `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` الأثر الجانبي نفسه في الرسائل الخاصة. يوفّر `direct["*"]` فقط إعدادًا افتراضيًا للدردشة المباشرة بعد أن تكون الرسالة الخاصة قد قُبلت أصلًا بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الاقتران.

مثال:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // استخدم هذا فقط إذا كان ينبغي السماح بجميع المجموعات في نطاق الجذر.
        // ينطبق على جميع الحسابات التي لا تعرّف خريطة groups خاصة بها.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // ينطبق على جميع الحسابات التي لا تعرّف خريطة direct خاصة بها.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // هذا الحساب يعرّف groups خاصة به، لذلك يتم استبدال groups الجذرية بالكامل.
            // للحفاظ على wildcard، عرّف "*" صراحة هنا أيضًا.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // استخدم هذا فقط إذا كان ينبغي السماح بجميع المجموعات في هذا الحساب.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // هذا الحساب يعرّف direct خاصة به، لذلك يتم استبدال إدخالات direct الجذرية بالكامل.
            // للحفاظ على wildcard، عرّف "*" صراحة هنا أيضًا.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## مؤشرات مرجعية للإعدادات

المرجع الأساسي:

- [مرجع الإعدادات - WhatsApp](/ar/gateway/config-channels#whatsapp)

حقول WhatsApp عالية الأهمية:

- الوصول: `dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom` و`groups`
- التسليم: `textChunkLimit` و`chunkMode` و`mediaMaxMb` و`sendReadReceipts` و`ackReaction` و`reactionLevel`
- تعدد الحسابات: `accounts.<id>.enabled` و`accounts.<id>.authDir` والتجاوزات على مستوى الحساب
- العمليات: `configWrites` و`debounceMs` و`web.enabled` و`web.heartbeatSeconds` و`web.reconnect.*`
- سلوك الجلسة: `session.dmScope` و`historyLimit` و`dmHistoryLimit` و`dms.<id>.historyLimit`
- الـ prompts: `groups.<id>.systemPrompt` و`groups["*"].systemPrompt` و`direct.<id>.systemPrompt` و`direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
