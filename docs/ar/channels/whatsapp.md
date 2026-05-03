---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T07:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). يمتلك Gateway الجلسة/الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يعرض الإعداد الأولي (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  تثبيت Plugin الخاص بـ WhatsApp في أول مرة تختاره فيها.
- يوفر `openclaw channels login --channel whatsapp` أيضا مسار التثبيت عندما
  لا يكون Plugin موجودا بعد.
- قناة التطوير + نسخة git: تستخدم افتراضيا مسار Plugin المحلي.
- Stable/Beta: يستخدم حزمة npm ‏`@openclaw/whatsapp` على وسم الإصدار الرسمي
  الحالي.

يبقى التثبيت اليدوي متاحا:

```bash
openclaw plugins install @openclaw/whatsapp
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارا دقيقا
فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات وقوائم إصلاح عبر القنوات.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعداد القنوات.
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

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. وتُحد الطلبات المعلقة إلى 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل عندما يكون ذلك ممكنا. (بيانات القناة الوصفية ومسار الإعداد محسّنان لهذا الإعداد، لكن إعدادات الأرقام الشخصية مدعومة أيضا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    هذا هو أنظف وضع تشغيلي:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح وحدود توجيه أوضح للرسائل المباشرة
    - احتمال أقل للالتباس الناتج عن المحادثة الذاتية

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
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب أساسا ملائما للمحادثة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    أثناء التشغيل، تعتمد حمايات المحادثة الذاتية على رقم الذات المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    قناة منصة المراسلة مبنية على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة Twilio WhatsApp منفصلة في سجل قنوات الدردشة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج التشغيل

- يمتلك Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- يستخدم مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس فقط حجم رسائل التطبيق الواردة، لذلك لا تُعاد جلسة الجهاز المرتبط الهادئة فقط لأن أحدا لم يرسل رسالة مؤخرا. لا يزال حد صمت التطبيق الأطول يفرض إعادة الاتصال إذا استمرت إطارات النقل في الوصول لكن لم تُعالج أي رسائل تطبيق خلال نافذة المراقبة؛ وبعد إعادة اتصال عابرة لجلسة كانت نشطة مؤخرا، يستخدم فحص صمت التطبيق هذا مهلة الرسائل العادية لنافذة التعافي الأولى.
- توقيتات مقبس Baileys صريحة ضمن `web.whatsapp.*`: يتحكم `keepAliveIntervalMs` في نبضات تطبيق WhatsApp Web، ويتحكم `connectTimeoutMs` في مهلة مصافحة الفتح، ويتحكم `defaultQueryTimeoutMs` في مهل استعلام Baileys.
- تتطلب عمليات الإرسال الصادرة مستمع WhatsApp نشطا للحساب المستهدف.
- تضيف رسائل المجموعات الصادرة بيانات وصفية أصلية للإشارات إلى رموز `@+<digits>` و`@<digits>` في النص وتعليقات الوسائط عندما يطابق الرمز بيانات مشاركي WhatsApp الوصفية الحالية، بما في ذلك المجموعات المدعومة بـ LID.
- تُتجاهل دردشات الحالة والبث (`@status`، `@broadcast`).
- يتبع مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس فقط حجم رسائل التطبيق الواردة: تبقى جلسات الأجهزة المرتبطة الهادئة عاملة أثناء استمرار إطارات النقل، لكن توقف النقل يفرض إعادة الاتصال قبل مسار قطع الاتصال البعيد اللاحق بوقت كبير.
- تستخدم الدردشات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ الافتراضي `main` يطوي الرسائل المباشرة في الجلسة الرئيسية للوكيل).
- جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يمكن أن تكون قنوات WhatsApp/النشرات أهدافا صادرة صريحة باستخدام JID الأصلي `@newsletter`. تستخدم عمليات الإرسال الصادرة إلى النشرات بيانات وصفية لجلسة القناة (`agent:<agentId>:whatsapp:channel:<jid>`) بدلا من دلالات جلسات الرسائل المباشرة.
- يلتزم نقل WhatsApp Web بمتغيرات بيئة الوكيل القياسية على مضيف Gateway ‏(`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / المتغيرات بالأحرف الصغيرة). فضّل إعداد الوكيل على مستوى المضيف على إعدادات وكيل WhatsApp الخاصة بالقناة.
- عند تمكين `messages.removeAckAfterReply`، يمسح OpenClaw تفاعل الإقرار في WhatsApp بعد تسليم رد مرئي.

## خطافات Plugin والخصوصية

يمكن أن تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصي، وأرقام هواتف،
ومعرّفات مجموعات، وأسماء مرسلين، وحقول ربط جلسات. لهذا السبب،
لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى plugins
إلا إذا اشتركت صراحة:

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

يمكنك حصر الاشتراك في حساب واحد:

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

فعّل هذا فقط لـ plugins التي تثق بها لتلقي محتوى ومعرّفات رسائل WhatsApp
الواردة.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى الدردشة المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقاما بنمط E.164 (تُطبّع داخليا).

    `allowFrom` هو قائمة تحكم في وصول مرسلي الرسائل المباشرة. وهو لا يحجب عمليات الإرسال الصادرة الصريحة إلى JIDs مجموعات WhatsApp أو JIDs قنوات `@newsletter`.

    تجاوز متعدد الحسابات: `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) لهما الأولوية على الافتراضات على مستوى القناة لذلك الحساب.

    تفاصيل سلوك التشغيل:

    - تُحفظ عمليات الاقتران في مخزن السماح للقناة وتُدمج مع `allowFrom` المكوّن
    - تستخدم الأتمتة المجدولة ومستلم Heartbeat الاحتياطي أهداف تسليم صريحة أو `allowFrom` المكوّن؛ موافقات اقتران الرسائل المباشرة ليست مستلمين ضمنيين لـ Cron أو Heartbeat
    - إذا لم تُكوّن قائمة سماح، يُسمح للرقم الذاتي المرتبط افتراضيا
    - لا يقترن OpenClaw تلقائيا أبدا مع رسائل `fromMe` المباشرة الصادرة (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="Group policy + allowlists">
    يحتوي وصول المجموعات على طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا حُذف `groups`، تكون كل المجموعات مؤهلة
       - إذا كان `groups` موجودا، يعمل كقائمة سماح للمجموعات (يُسمح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: يحظر كل الوارد من المجموعات

    احتياطي قائمة سماح المرسلين:

    - إذا لم يُعيّن `groupAllowFrom`، يعود التشغيل إلى `allowFrom` عند توفره
    - تُقيّم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` على الإطلاق، يكون احتياطي سياسة المجموعات أثناء التشغيل هو `allowlist` (مع سجل تحذير)، حتى إذا كان `channels.defaults.groupPolicy` مضبوطا.

  </Tab>

  <Tab title="Mentions + /activation">
    تتطلب ردود المجموعات إشارة افتراضيا.

    يشمل اكتشاف الإشارات:

    - إشارات WhatsApp الصريحة إلى هوية الروبوت
    - أنماط تعبيرات الإشارة المكوّنة (`agents.list[].groupChat.mentionPatterns`، واحتياطي `messages.groupChat.mentionPatterns`)
    - نصوص ملاحظات الصوت الواردة لرسائل المجموعات المصرح بها
    - اكتشاف الرد الضمني على الروبوت (يطابق مرسل الرد هوية الروبوت)

    ملاحظة أمنية:

    - الاقتباس/الرد يفي فقط ببوابة الإشارة؛ ولا يمنح تفويض المرسل
    - مع `groupPolicy: "allowlist"`، يبقى المرسلون غير الموجودين في قائمة السماح محظورين حتى إذا ردوا على رسالة مستخدم موجود في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس الإعداد العام). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والمحادثة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودا أيضا في `allowFrom`، تُفعّل حمايات المحادثة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لدورات المحادثة الذاتية
- تجاهل سلوك التشغيل التلقائي بإشارة JID الذي كان سيؤدي بخلاف ذلك إلى تنبيه نفسك
- إذا لم يُعيّن `messages.responsePrefix`، تصبح ردود المحادثة الذاتية افتراضيا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    تُغلّف رسائل WhatsApp الواردة في المغلف الوارد المشترك.

    إذا وُجد رد مقتبس، يُلحق السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُملأ حقول بيانات الرد الوصفية أيضا عند توفرها (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، وJID/E.164 للمرسل).
    عندما يكون هدف الرد المقتبس وسائط قابلة للتنزيل، يحفظه OpenClaw عبر
    مخزن الوسائط الواردة العادي ويعرضه كـ `MediaPath`/`MediaType` حتى
    يتمكن الوكيل من فحص الصورة المشار إليها بدلا من رؤية
    `<media:image>` فقط.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    تُطبّع الرسائل الواردة التي تحتوي على وسائط فقط باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تُنسخ ملاحظات الصوت للمجموعات المصرح بها قبل بوابة الإشارة عندما يكون
    المتن هو `<media:audio>` فقط، لذلك يمكن أن يؤدي ذكر الروبوت في الملاحظة الصوتية
    إلى تشغيل الرد. إذا كان النص المنسوخ لا يزال لا يذكر الروبوت، فيُحفظ
    النص المنسوخ في سجل المجموعة المعلق بدلا من العنصر النائب الخام.

    تستخدم متون الموقع نص إحداثيات موجزا. تُعرض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات وصفية غير موثوقة ضمن سياج، وليس كنص مطالبة مضمن.

  </Accordion>

  <Accordion title="Pending group history injection">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتا وحقنها كسياق عندما يُشغّل الروبوت أخيرا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - يعطّل `0` ذلك

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    تُفعّل إيصالات القراءة افتراضيا لرسائل WhatsApp الواردة المقبولة.

    التعطيل عالميا:

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

    تتجاوز محادثات الذات إيصالات القراءة حتى عند تفعيلها عموميا.

  </Accordion>
</AccordionGroup>

## التسليم، والتقسيم إلى أجزاء، والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص إلى أجزاء">
    - حد الأجزاء الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التقسيم الآمن حسب الطول

  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - ترسل الوسائط الصوتية عبر حمولة Baileys `audio` مع `ptt: true`، لذلك تعرضها عملاء WhatsApp كملاحظة صوتية اضغط للتحدث
    - تحافظ حمولات الرد على `audioAsVoice`؛ يبقى إخراج ملاحظة TTS الصوتية لـ WhatsApp على مسار PTT هذا حتى عندما يعيد المزود MP3 أو WebM
    - يرسل صوت Ogg/Opus الأصلي كـ `audio/ogg; codecs=opus` للتوافق مع الملاحظات الصوتية
    - يحول الصوت غير Ogg، بما في ذلك إخراج Microsoft Edge TTS بصيغ MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي بتردد 48 كيلوهرتز قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد من المساعد كملاحظة صوتية واحدة ويمنع الإرسال المتكرر للرد نفسه؛ يتحكم `/tts chat on|off|default` في TTS التلقائي لمحادثة WhatsApp الحالية
    - يدعم تشغيل GIF المتحرك عبر `gifPlayback: true` عند إرسال الفيديو
    - تطبق التعليقات على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط، باستثناء ملاحظات PTT الصوتية التي ترسل الصوت أولا والنص المرئي بشكل منفصل لأن عملاء WhatsApp لا يعرضون تعليقات الملاحظات الصوتية باتساق
    - يمكن أن يكون مصدر الوسائط HTTP(S)، أو `file://`، أو مسارات محلية

  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الاحتياط">
    - حد حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - حد إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - يتم تحسين الصور تلقائيا (تغيير الحجم/مسح الجودة) لتناسب الحدود
    - عند فشل إرسال الوسائط، يرسل احتياط العنصر الأول تحذيرا نصيا بدلا من إسقاط الرد بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الرد

يدعم WhatsApp اقتباس الرد الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم به باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | لا تقتبس أبدا؛ أرسل كرسالة عادية                                  |
| `"first"`   | اقتبس أول جزء رد صادر فقط                             |
| `"all"`     | اقتبس كل جزء رد صادر                                      |
| `"batched"` | اقتبس الردود المجمعة في الطابور مع ترك الردود الفورية بلا اقتباس |

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
| `"off"`       | لا            | لا                        | لا توجد تفاعلات إطلاقا                              |
| `"ack"`       | نعم           | لا                        | تفاعلات الإقرار فقط (إيصال قبل الرد)           |
| `"minimal"`   | نعم           | نعم (محافظ)        | إقرار + تفاعلات الوكيل مع إرشاد محافظ |
| `"extensive"` | نعم           | نعم (مشجع)          | إقرار + تفاعلات الوكيل مع إرشاد مشجع   |

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

يدعم WhatsApp تفاعلات الإقرار الفورية عند إيصال الوارد عبر `channels.whatsapp.ackReaction`.
تخضع تفاعلات الإقرار لـ `reactionLevel` — يتم منعها عندما يكون `reactionLevel` هو `"off"`.

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

- ترسل فور قبول الوارد (قبل الرد)
- تسجل الإخفاقات لكنها لا تمنع تسليم الرد العادي
- يتفاعل وضع المجموعة `mentions` في الدورات التي تشغلها الإشارة؛ يعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp `channels.whatsapp.ackReaction` (لا يستخدم `messages.ackReaction` القديم هنا)

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والإعدادات الافتراضية">
    - تأتي معرفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودا، وإلا أول معرف حساب مهيأ (بعد الفرز)
    - تتم تسوية معرفات الحسابات داخليا للبحث

  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق القديم">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا تزال المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` معروفة/مرحلة لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يمسح `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب.

    عندما يكون Gateway قابلا للوصول، يوقف تسجيل الخروج أولا مستمع WhatsApp الحي للحساب المحدد حتى لا تستمر الجلسة المرتبطة في تلقي الرسائل حتى إعادة التشغيل التالية. يوقف `openclaw channels remove --channel whatsapp` أيضا المستمع الحي قبل تعطيل إعدادات الحساب أو حذفها.

    في أدلة المصادقة القديمة، يتم الاحتفاظ بـ `oauth.json` بينما تزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات الإعدادات

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp (`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- كتابات الإعدادات التي تبدأ من القناة مفعلة افتراضيا (عطلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (يلزم QR)">
    العَرَض: تبلغ حالة القناة أنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكنه مفصول / حلقة إعادة اتصال">
    العَرَض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    يمكن أن تبقى الحسابات الهادئة متصلة بعد مهلة الرسائل العادية؛ يعيد المراقب
    التشغيل عندما يتوقف نشاط نقل WhatsApp Web، أو يغلق المقبس، أو
    يبقى النشاط على مستوى التطبيق صامتا بعد نافذة الأمان الأطول.

    إذا أظهرت السجلات `status=408 Request Time-out Connection was lost` متكررا، فاضبط
    توقيتات مقبس Baileys ضمن `web.whatsapp`. ابدأ بتقصير
    `keepAliveIntervalMs` إلى أقل من مهلة الخمول في شبكتك وزيادة
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

    إذا قال `~/.openclaw/logs/whatsapp-health.log` إن `Gateway inactive` لكن
    `openclaw gateway status` و`openclaw channels status --probe` يظهران أن
    Gateway وWhatsApp سليمان، فشغل `openclaw doctor`. على Linux، يحذر doctor
    من إدخالات crontab القديمة التي لا تزال تستدعي
    `~/.openclaw/bin/ensure-whatsapp.sh`؛ أزل تلك الإدخالات القديمة باستخدام
    `crontab -e` لأن cron قد يفتقر إلى بيئة ناقل مستخدم systemd ويمكنه
    جعل ذلك السكربت القديم يسيء الإبلاغ عن صحة Gateway.

    إذا لزم الأمر، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="تنتهي مهلة تسجيل الدخول QR خلف وكيل">
    العَرَض: يفشل `openclaw channels login --channel whatsapp` قبل إظهار رمز QR صالح للاستخدام مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل دخول WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway (`HTTPS_PROXY`، و`HTTP_PROXY`، والمتغيرات بالأحرف الصغيرة، و`NO_PROXY`). تحقق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل الإرسالات الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يظهر الرد في النص لكنه لا يظهر في WhatsApp">
    تسجل صفوف النص ما أنشأه الوكيل. يتم فحص تسليم WhatsApp بشكل منفصل: لا يتعامل OpenClaw مع الرد التلقائي على أنه مرسل إلا بعد أن يعيد Baileys معرف رسالة صادرة لإرسال نص مرئي أو وسائط واحد على الأقل.

    تفاعلات الإقرار هي إيصالات مستقلة قبل الرد. لا يثبت التفاعل الناجح أن الرد النصي أو الإعلامي اللاحق قُبل من WhatsApp.

    تحقق من سجلات Gateway بحثا عن `auto-reply delivery failed` أو `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعة بشكل غير متوقع">
    تحقق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارات (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` (JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذلك احتفظ بـ `groupPolicy` واحد لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل WhatsApp Gateway ‏Node. يتم وسم Bun كغير متوافق لتشغيل WhatsApp/Telegram Gateway المستقر.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات نظام بأسلوب Telegram للمجموعات والمحادثات المباشرة عبر خرائط `groups` و`direct`.

تسلسل الحل لرسائل المجموعة:

تحدد خريطة `groups` الفعالة أولا: إذا عرّف الحساب `groups` الخاصة به، فإنها تستبدل بالكامل خريطة `groups` الجذرية (لا يوجد دمج عميق). ثم يعمل بحث المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة نظام خاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تستخدم عندما يكون إدخال المجموعة المحددة موجودا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرفا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يتم منع حرف البدل ولا تطبق أي مطالبة نظام.
2. **مطالبة نظام حرف البدل للمجموعة** (`groups["*"].systemPrompt`): تستخدم عندما يكون إدخال المجموعة المحددة غائبا تماما عن الخريطة، أو عندما يكون موجودا لكنه لا يعرف مفتاح `systemPrompt`.

تسلسل الحل للرسائل المباشرة:

تحدد خريطة `direct` الفعالة أولا: إذا عرّف الحساب `direct` الخاصة به، فإنها تستبدل بالكامل خريطة `direct` الجذرية (لا يوجد دمج عميق). ثم يعمل بحث المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة نظام خاصة بالمباشر** (`direct["<peerId>"].systemPrompt`): تستخدم عندما يكون إدخال النظير المحدد موجودا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرفا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يتم منع حرف البدل ولا تطبق أي مطالبة نظام.
2. **مطالبة نظام حرف البدل للمباشر** (`direct["*"].systemPrompt`): تستخدم عندما يكون إدخال النظير المحدد غائبا تماما عن الخريطة، أو عندما يكون موجودا لكنه لا يعرف مفتاح `systemPrompt`.

<Note>
يبقى `dms` حاوية تجاوز سجل خفيفة لكل رسالة مباشرة (`dms.<id>.historyLimit`). توجد تجاوزات المطالبات ضمن `direct`.
</Note>

**الاختلاف عن سلوك تعدد الحسابات في Telegram:** في Telegram، يتم حجب `groups` الجذرية عمدًا لجميع الحسابات في إعداد متعدد الحسابات، حتى الحسابات التي لا تعرّف أي `groups` خاصة بها، لمنع الروبوت من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبق WhatsApp هذا الإجراء الوقائي: يتم دائمًا توريث `groups` الجذرية و`direct` الجذرية بواسطة الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المكوّنة. في إعداد WhatsApp متعدد الحسابات، إذا أردت مطالبات مجموعات أو محادثات مباشرة لكل حساب، فعرّف الخريطة الكاملة تحت كل حساب صراحةً بدلًا من الاعتماد على الإعدادات الافتراضية على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هي خريطة إعدادات لكل مجموعة وقائمة سماح للمجموعات على مستوى الدردشة في الوقت نفسه. في نطاق الجذر أو الحساب، تعني `groups["*"]` أن "كل المجموعات مسموح بها" لذلك النطاق.
- لا تضف `systemPrompt` لمجموعة بدل عام إلا عندما تريد أصلًا أن يسمح ذلك النطاق بكل المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كإعداد افتراضي للمطالبة. بدلًا من ذلك، كرر المطالبة في كل إدخال مجموعة مسموح به صراحةً.
- قبول المجموعة وتفويض المرسل فحصان منفصلان. توسّع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنها لا تفوض وحدها كل مرسل في تلك المجموعات. لا يزال وصول المرسل مضبوطًا بشكل منفصل عبر `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يكون لـ `channels.whatsapp.direct` الأثر الجانبي نفسه للرسائل المباشرة. توفر `direct["*"]` فقط إعداد دردشة مباشرة افتراضيًا بعد قبول رسالة مباشرة أصلًا بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الإقران.

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

## مؤشرات مرجع الإعدادات

المرجع الأساسي:

- [مرجع الإعدادات - WhatsApp](/ar/gateway/config-channels#whatsapp)

حقول WhatsApp عالية الأهمية:

- الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- تعدد الحسابات: `accounts.<id>.enabled`, `accounts.<id>.authDir`, التجاوزات على مستوى الحساب
- العمليات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- سلوك الجلسة: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- المطالبات: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ذو صلة

- [الإقران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
