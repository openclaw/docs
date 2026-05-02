---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

الحالة: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). يمتلك Gateway الجلسة/الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يطلب الإعداد الأولي (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  تثبيت Plugin الخاص بـ WhatsApp في أول مرة تختاره فيها.
- يوفّر `openclaw channels login --channel whatsapp` أيضًا تدفق التثبيت عندما
  لا يكون Plugin موجودًا بعد.
- قناة التطوير + استنساخ git: تستخدم مسار Plugin المحلي افتراضيًا.
- Stable/Beta: تستخدم حزمة npm ‏`@openclaw/whatsapp` على وسم الإصدار الرسمي
  الحالي.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

استخدم الحزمة المجرّدة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا دقيقًا
فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وخطط إصلاح.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعدادات القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

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

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. تُحدّ الطلبات المعلّقة إلى 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل متى أمكن. (بيانات تعريف القناة وتدفق الإعداد محسّنان لهذا الإعداد، لكن إعدادات الأرقام الشخصية مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    هذا هو النمط التشغيلي الأنظف:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح أوضح للرسائل المباشرة وحدود توجيه أوضح
    - احتمال أقل لالتباس الدردشة الذاتية

    نمط سياسة بسيط:

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

  <Accordion title="Personal-number fallback">
    يدعم الإعداد الأولي نمط الرقم الشخصي ويكتب خط أساس مناسبًا للدردشة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تعتمد حمايات الدردشة الذاتية على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    قناة منصة المراسلة مبنية على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة Twilio WhatsApp منفصلة في سجل قنوات الدردشة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يمتلك Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- يستخدم مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط، لذلك لا يُعاد تشغيل جلسة جهاز مرتبط هادئة لمجرد أن أحدًا لم يرسل رسالة مؤخرًا. لا يزال حد صمت التطبيق الأطول يفرض إعادة اتصال إذا استمرت إطارات النقل بالوصول لكن لم تُعالَج أي رسائل تطبيق خلال نافذة المراقبة؛ وبعد إعادة اتصال عابرة لجلسة كانت نشطة مؤخرًا، يستخدم فحص صمت التطبيق هذا مهلة الرسائل العادية لأول نافذة استرداد.
- توقيتات مقبس Baileys صريحة ضمن `web.whatsapp.*`: يتحكم `keepAliveIntervalMs` في نبضات تطبيق WhatsApp Web، ويتحكم `connectTimeoutMs` في مهلة مصافحة الفتح، ويتحكم `defaultQueryTimeoutMs` في مهل استعلامات Baileys.
- تتطلب الإرسالات الصادرة مستمع WhatsApp نشطًا للحساب الهدف.
- يتم تجاهل دردشات الحالة والبث (`@status`، `@broadcast`).
- يتبع مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط: تبقى جلسات الأجهزة المرتبطة الهادئة عاملة ما دامت إطارات النقل مستمرة، لكن توقف النقل يفرض إعادة الاتصال قبل وقت طويل من مسار قطع الاتصال البعيد اللاحق.
- تستخدم الدردشات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ القيمة الافتراضية `main` تطوي الرسائل المباشرة إلى الجلسة الرئيسية للوكيل).
- جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يمكن أن تكون قنوات/نشرات WhatsApp أهدافًا صادرة صريحة باستخدام JID الأصلي `@newsletter`. تستخدم الإرسالات الصادرة إلى النشرات بيانات تعريف جلسة القناة (`agent:<agentId>:whatsapp:channel:<jid>`) بدلًا من دلالات جلسات الرسائل المباشرة.
- يحترم نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / المتغيرات بالحروف الصغيرة). فضّل إعداد الوكيل على مستوى المضيف على إعدادات وكيل WhatsApp الخاصة بالقناة.
- عند تمكين `messages.removeAckAfterReply`، يمسح OpenClaw تفاعل إقرار WhatsApp بعد تسليم رد مرئي.

## خطاطيف Plugin والخصوصية

يمكن أن تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصي، وأرقام هواتف،
ومعرّفات مجموعات، وأسماء مرسلين، وحقول ربط الجلسات. لهذا السبب،
لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى plugins
ما لم تختَر ذلك صراحةً:

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

يمكنك حصر الاشتراك الاختياري بحساب واحد:

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

فعّل هذا فقط مع plugins التي تثق بها لتلقي محتوى رسائل WhatsApp الواردة
والمعرّفات.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.whatsapp.dmPolicy` في وصول الدردشة المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقامًا بنمط E.164 (تُطبّع داخليًا).

    `allowFrom` هي قائمة تحكم في وصول مرسلي الرسائل المباشرة. وهي لا تقيد الإرسالات الصادرة الصريحة إلى JIDs مجموعات WhatsApp أو JIDs قنوات `@newsletter`.

    تجاوز الحسابات المتعددة: تكون أسبقية `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) على الافتراضيات على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفَظ الاقترانات في مخزن السماح للقناة وتُدمَج مع `allowFrom` المكوّن
    - تستخدم الأتمتة المجدولة والوجهة الاحتياطية لمتلقي Heartbeat أهداف تسليم صريحة أو `allowFrom` المكوّن؛ لا تُعد موافقات اقتران الرسائل المباشرة ضمنيًا مستلمي cron أو Heartbeat
    - إذا لم تُضبط قائمة سماح، يُسمح للرقم الذاتي المرتبط افتراضيًا
    - لا يجري OpenClaw اقترانًا تلقائيًا لرسائل `fromMe` المباشرة الصادرة (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="Group policy + allowlists">
    وصول المجموعات له طبقتان:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا حُذف `groups`، تكون كل المجموعات مؤهلة
       - إذا كان `groups` موجودًا، فهو يعمل كقائمة سماح للمجموعات (يُسمح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: تجاوز قائمة سماح المرسل
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الوارد من المجموعات

    رجوع قائمة سماح المرسل:

    - إذا لم يُضبط `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفره
    - تُقيّم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` إطلاقًا، فإن رجوع سياسة المجموعات في وقت التشغيل هو `allowlist` (مع سجل تحذير)، حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا.

  </Tab>

  <Tab title="Mentions + /activation">
    تتطلب ردود المجموعات الإشارة افتراضيًا.

    يشمل اكتشاف الإشارات:

    - إشارات WhatsApp صريحة إلى هوية البوت
    - أنماط regex للإشارات المكوّنة (`agents.list[].groupChat.mentionPatterns`، والرجوع إلى `messages.groupChat.mentionPatterns`)
    - نصوص ملاحظات الصوت الواردة لرسائل المجموعات المصرح بها
    - اكتشاف الرد الضمني على البوت (مرسل الرد يطابق هوية البوت)

    ملاحظة أمنية:

    - لا يفي الاقتباس/الرد إلا ببوابة الإشارة؛ وهو **لا** يمنح تفويض المرسل
    - مع `groupPolicy: "allowlist"`، يبقى المرسلون غير الموجودين في قائمة السماح محظورين حتى إذا ردوا على رسالة مستخدم موجود في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس الإعدادات العامة). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والدردشة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، تتفعّل ضمانات الدردشة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لدورات الدردشة الذاتية
- تجاهل سلوك التشغيل التلقائي لإشارة JID الذي كان سيشير إلى نفسك بخلاف ذلك
- إذا لم يُضبط `messages.responsePrefix`، تكون ردود الدردشة الذاتية افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    تُغلّف رسائل WhatsApp الواردة في الغلاف الوارد المشترك.

    إذا كان هناك رد مقتبس، يُلحَق السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُملأ أيضًا حقول بيانات تعريف الرد عند توفرها (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، JID/E.164 للمرسل).
    عندما يكون هدف الرد المقتبس وسائط قابلة للتنزيل، يحفظها OpenClaw عبر
    مخزن الوسائط الواردة العادي ويعرضها كـ `MediaPath`/`MediaType` حتى
    يتمكن الوكيل من فحص الصورة المشار إليها بدلًا من رؤية
    `<media:image>` فقط.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    تُطبّع الرسائل الواردة التي تحتوي على وسائط فقط باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تُنسخ ملاحظات الصوت المصرح بها في المجموعات قبل بوابة الإشارة عندما يكون
    المتن هو `<media:audio>` فقط، لذلك يمكن أن يؤدي نطق إشارة البوت في الملاحظة الصوتية إلى
    تشغيل الرد. إذا ظل النص المنسوخ لا يذكر البوت، يُحفظ
    النص المنسوخ في سجل المجموعة المعلّق بدلًا من العنصر النائب الخام.

    تستخدم متون المواقع نص إحداثيات موجزًا. تُعرض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات تعريف غير موثوقة داخل سياج، وليس كنص مطالبة مضمن.

  </Accordion>

  <Accordion title="Pending group history injection">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يُشغَّل البوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الرجوع: `messages.groupChat.historyLimit`
    - `0` يعطّل ذلك

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    تكون إيصالات القراءة مفعّلة افتراضيًا لرسائل WhatsApp الواردة المقبولة.

    التعطيل عالميًا:

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

    تتجاوز محادثات الذات إيصالات القراءة حتى عند تفعيلها عمومًا.

  </Accordion>
</AccordionGroup>

## التسليم والتقسيم والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص">
    - حد التقسيم الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التقسيم الآمن حسب الطول

  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - تُرسل الوسائط الصوتية عبر حمولة Baileys `audio` مع `ptt: true`، لذلك تعرضها عملاء WhatsApp كملاحظة صوتية اضغط للتحدث
    - تحافظ حمولات الرد على `audioAsVoice`؛ ويبقى إخراج ملاحظة TTS الصوتية لـ WhatsApp على مسار PTT هذا حتى عندما يعيد المزوّد MP3 أو WebM
    - يُرسل صوت Ogg/Opus الأصلي كـ `audio/ogg; codecs=opus` لتوافق الملاحظات الصوتية
    - يُحوَّل الصوت غير Ogg، بما في ذلك إخراج Microsoft Edge TTS بصيغ MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي 48 كيلوهرتز قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد من المساعد كملاحظة صوتية واحدة ويمنع الإرسال المتكرر للرد نفسه؛ ويتحكم `/tts chat on|off|default` في TTS التلقائي لمحادثة WhatsApp الحالية
    - يدعم تشغيل GIF المتحرك عبر `gifPlayback: true` في عمليات إرسال الفيديو
    - تُطبّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط، باستثناء ملاحظات PTT الصوتية التي ترسل الصوت أولًا والنص المرئي منفصلًا لأن عملاء WhatsApp لا يعرضون تسميات الملاحظات الصوتية التوضيحية بشكل متسق
    - يمكن أن يكون مصدر الوسائط HTTP(S)، أو `file://`، أو مسارات محلية

  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الرجوع الاحتياطي">
    - حد حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - حد إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسَّن الصور تلقائيًا (تغيير الحجم/مسح الجودة) لتناسب الحدود
    - عند فشل إرسال الوسائط، يرسل الرجوع الاحتياطي للعنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الاستجابة بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الرد

يدعم WhatsApp اقتباس الرد الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكّم فيه باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | لا تقتبس أبدًا؛ أرسل كرسالة عادية                                  |
| `"first"`   | اقتبس أول مقطع رد صادر فقط                             |
| `"all"`     | اقتبس كل مقطع رد صادر                                      |
| `"batched"` | اقتبس الردود المجمعة في الطابور مع ترك الردود الفورية دون اقتباس |

الافتراضي هو `"off"`. تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## مستوى التفاعل

يتحكم `channels.whatsapp.reactionLevel` في مدى استخدام الوكيل لتفاعلات الرموز التعبيرية على WhatsApp:

| المستوى         | تفاعلات الإقرار | التفاعلات التي يبدأها الوكيل | الوصف                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | لا            | لا                        | لا توجد تفاعلات إطلاقًا                              |
| `"ack"`       | نعم           | لا                        | تفاعلات الإقرار فقط (إيصال قبل الرد)           |
| `"minimal"`   | نعم           | نعم (محافظ)        | إقرار + تفاعلات الوكيل مع توجيه محافظ |
| `"extensive"` | نعم           | نعم (مشجّع)          | إقرار + تفاعلات الوكيل مع توجيه مشجّع   |

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

يدعم WhatsApp تفاعلات الإقرار الفورية عند استلام الرسائل الواردة عبر `channels.whatsapp.ackReaction`.
تُقيَّد تفاعلات الإقرار بواسطة `reactionLevel` — إذ تُمنع عندما يكون `reactionLevel` هو `"off"`.

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
- تُسجَّل حالات الفشل لكنها لا تمنع تسليم الرد العادي
- يتفاعل وضع المجموعة `mentions` في الأدوار التي تؤديها الإشارات؛ ويعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp `channels.whatsapp.ackReaction` (ولا يُستخدم `messages.ackReaction` القديم هنا)

## تعدد الحسابات وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والافتراضيات">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إن كان موجودًا، وإلا فأول معرّف حساب مهيأ (بعد الفرز)
    - تُطبَّع معرّفات الحسابات داخليًا للبحث

  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق القديم">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - ما زالت المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` معروفة/مُرحّلة لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يمسح `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب.

    عندما يكون Gateway قابلًا للوصول، يوقف تسجيل الخروج أولًا مستمع WhatsApp الحي للحساب المحدد حتى لا تستمر الجلسة المرتبطة في تلقي الرسائل إلى حين إعادة التشغيل التالية. يوقف `openclaw channels remove --channel whatsapp` أيضًا المستمع الحي قبل تعطيل تهيئة الحساب أو حذفها.

    في أدلة المصادقة القديمة، يُحتفظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات التهيئة

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp (`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تُفعَّل كتابات التهيئة التي تبدأها القناة افتراضيًا (عطّلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (يتطلب رمز QR)">
    العَرَض: تفيد حالة القناة بأنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكنه منفصل / حلقة إعادة اتصال">
    العَرَض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    يمكن أن تبقى الحسابات الهادئة متصلة بعد مهلة الرسائل العادية؛ يعيد المراقب
    التشغيل عندما يتوقف نشاط نقل WhatsApp Web، أو يُغلق المقبس، أو
    يبقى النشاط على مستوى التطبيق صامتًا بعد نافذة الأمان الأطول.

    إذا أظهرت السجلات تكرار `status=408 Request Time-out Connection was lost`، فاضبط
    توقيتات مقبس Baileys ضمن `web.whatsapp`. ابدأ بتقصير
    `keepAliveIntervalMs` إلى أقل من مهلة خمول شبكتك وزيادة
    `connectTimeoutMs` على الروابط البطيئة أو كثيرة الفقد:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    الإصلاح:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    إذا كان `~/.openclaw/logs/whatsapp-health.log` يقول `Gateway inactive` لكن
    `openclaw gateway status` و`openclaw channels status --probe` يبيّنان أن
    Gateway وWhatsApp بحالة سليمة، فشغّل `openclaw doctor`. على Linux، يحذّر doctor
    من إدخالات crontab القديمة التي لا تزال تستدعي
    `~/.openclaw/bin/ensure-whatsapp.sh`؛ أزِل تلك الإدخالات القديمة باستخدام
    `crontab -e` لأن cron قد يفتقر إلى بيئة ناقل مستخدم systemd وقد
    يجعل ذلك السكربت القديم يبلّغ عن صحة Gateway بشكل خاطئ.

    إذا لزم الأمر، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="تنتهي مهلة تسجيل دخول QR خلف وكيل">
    العَرَض: يفشل `openclaw channels login --channel whatsapp` قبل عرض رمز QR قابل للاستخدام مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل دخول WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway (`HTTPS_PROXY` و`HTTP_PROXY` والمتغيرات ذات الأحرف الصغيرة و`NO_PROXY`). تحقّق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل عمليات الإرسال الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يظهر الرد في السجل النصي لكنه لا يظهر في WhatsApp">
    تسجل صفوف السجل النصي ما أنشأه الوكيل. يتم التحقق من تسليم WhatsApp بشكل منفصل: لا يعتبر OpenClaw الرد التلقائي مُرسلاً إلا بعد أن يعيد Baileys معرّف رسالة صادرة لإرسال نص مرئي أو وسائط واحد على الأقل.

    تفاعلات الإقرار هي إيصالات مستقلة تسبق الرد. لا يثبت التفاعل الناجح أن الرد النصي أو رد الوسائط اللاحق قد قُبل من WhatsApp.

    افحص سجلات Gateway بحثًا عن `auto-reply delivery failed` أو `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعة بشكل غير متوقع">
    تحقّق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارات (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` (JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذا احتفظ بـ `groupPolicy` واحد لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل Gateway الخاص بـ WhatsApp ‏Node. يُشار إلى Bun على أنه غير متوافق مع التشغيل المستقر لـ Gateway الخاص بـ WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات نظام بأسلوب Telegram للمجموعات والدردشات المباشرة عبر خريطتي `groups` و`direct`.

تدرج الحل لرسائل المجموعة:

تُحدَّد خريطة `groups` الفعالة أولًا: إذا عرّف الحساب `groups` الخاصة به، فإنها تستبدل خريطة `groups` الجذرية بالكامل (من دون دمج عميق). ثم يعمل البحث عن المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة النظام الخاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحدد موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يتم تعطيل حرف البدل ولا تُطبَّق أي مطالبة نظام.
2. **مطالبة نظام حرف البدل للمجموعات** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحدد غائبًا عن الخريطة بالكامل، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

تدرج الحل للرسائل المباشرة:

تُحدَّد خريطة `direct` الفعالة أولًا: إذا عرّف الحساب `direct` الخاصة به، فإنها تستبدل خريطة `direct` الجذرية بالكامل (من دون دمج عميق). ثم يعمل البحث عن المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة النظام الخاصة بالمباشر** (`direct["<peerId>"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يتم تعطيل حرف البدل ولا تُطبَّق أي مطالبة نظام.
2. **مطالبة نظام حرف البدل للمباشر** (`direct["*"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد غائبًا عن الخريطة بالكامل، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

<Note>
يبقى `dms` حاوية التجاوز الخفيفة للسجل لكل رسالة مباشرة (`dms.<id>.historyLimit`). تعيش تجاوزات المطالبات ضمن `direct`.
</Note>

**الاختلاف عن سلوك Telegram متعدد الحسابات:** في Telegram، يتم حجب `groups` الجذرية عمدًا لكل الحسابات في إعداد متعدد الحسابات، حتى الحسابات التي لا تعرّف أي `groups` خاصة بها، لمنع الروبوت من تلقي رسائل مجموعات لمجموعات لا ينتمي إليها. لا يطبّق WhatsApp هذا الحارس: يتم دائمًا توريث `groups` الجذرية و`direct` الجذرية بواسطة الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات التي تم تكوينها. في إعداد WhatsApp متعدد الحسابات، إذا أردت مطالبات مجموعات أو مباشرة لكل حساب، فعرّف الخريطة الكاملة ضمن كل حساب صراحةً بدلًا من الاعتماد على الافتراضيات على المستوى الجذري.

سلوك مهم:

- `channels.whatsapp.groups` هي خريطة تكوين لكل مجموعة وقائمة سماح للمجموعات على مستوى الدردشة في الوقت نفسه. عند النطاق الجذري أو نطاق الحساب، يعني `groups["*"]` أن "كل المجموعات مسموح بها" لذلك النطاق.
- لا تضف `systemPrompt` لمجموعة بدل عام إلا عندما تريد بالفعل أن يسمح ذلك النطاق بكل المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` لافتراضي المطالبة. بدلًا من ذلك، كرر المطالبة في كل إدخال مجموعة مسموح به صراحةً.
- قبول المجموعة وتخويل المرسل فحصان منفصلان. يوسّع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنه لا يخول بمفرده كل مرسل في تلك المجموعات. لا يزال وصول المرسل مضبوطًا بشكل منفصل عبر `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` الأثر الجانبي نفسه للرسائل المباشرة. يوفر `direct["*"]` تكوينًا افتراضيًا للدردشة المباشرة فقط بعد قبول رسالة مباشرة بالفعل بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الاقتران.

مثال:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## مؤشرات مرجع التكوين

المرجع الأساسي:

- [مرجع التكوين - WhatsApp](/ar/gateway/config-channels#whatsapp)

حقول WhatsApp عالية الأهمية:

- الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- متعدد الحسابات: `accounts.<id>.enabled`, `accounts.<id>.authDir`، التجاوزات على مستوى الحساب
- العمليات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- سلوك الجلسة: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- المطالبات: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
