---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T07:44:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

الحالة: جاهز للإنتاج عبر WhatsApp Web (Baileys). يتولى Gateway ملكية الجلسة أو الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يطلب الإعداد الأولي (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  تثبيت Plugin الخاص بـ WhatsApp عند اختياره لأول مرة.
- يوفر `openclaw channels login --channel whatsapp` أيضًا مسار التثبيت عندما
  لا يكون Plugin موجودًا بعد.
- قناة التطوير + نسخة git: تستخدم مسار Plugin المحلي افتراضيًا.
- Stable/Beta: تستخدم حزمة npm `@openclaw/whatsapp` عندما تكون حزمة حالية
  منشورة.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة أو مفقودة، فاستخدم
بنية OpenClaw حالية ومعبأة أو نسخة محلية إلى أن يلحق قطار حزم npm.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وخطط إصلاح.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لإعداد القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="إعداد سياسة وصول WhatsApp">

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

  <Step title="ربط WhatsApp (QR)">

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

  <Step title="بدء Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="الموافقة على أول طلب اقتران (إذا كنت تستخدم وضع الاقتران)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. ويُحدّد سقف الطلبات المعلقة عند 3 لكل قناة.

  </Step>
</Steps>

<Note>
توصي OpenClaw بتشغيل WhatsApp على رقم منفصل عندما يكون ذلك ممكنًا. (بيانات تعريف القناة ومسار الإعداد محسّنان لهذا الإعداد، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو أنظف وضع تشغيلي:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح أوضح للرسائل المباشرة وحدود توجيه أوضح
    - احتمال أقل لحدوث التباس في المحادثة الذاتية

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

  <Accordion title="الرجوع إلى الرقم الشخصي">
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب أساسًا مناسبًا للمحادثة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    أثناء التشغيل، تعتمد حمايات المحادثة الذاتية على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة مستندة إلى WhatsApp Web (`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة Twilio WhatsApp منفصلة في سجل قنوات الدردشة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج التشغيل

- يتولى Gateway ملكية مقبس WhatsApp وحلقة إعادة الاتصال.
- يستخدم مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس فقط حجم رسائل التطبيق الواردة، لذلك لا تُعاد بداية جلسة جهاز مرتبط هادئة لمجرد أن أحدًا لم يرسل رسالة مؤخرًا. لا يزال حد صمت التطبيق الأطول يفرض إعادة اتصال إذا استمرت إطارات النقل في الوصول لكن لم تتم معالجة أي رسائل تطبيق خلال نافذة المراقبة؛ بعد إعادة اتصال عابرة لجلسة نشطة مؤخرًا، يستخدم فحص صمت التطبيق ذلك مهلة الرسائل العادية لأول نافذة استرداد.
- توقيتات مقبس Baileys صريحة ضمن `web.whatsapp.*`: يتحكم `keepAliveIntervalMs` في إشارات ping لتطبيق WhatsApp Web، ويتحكم `connectTimeoutMs` في مهلة مصافحة الفتح، ويتحكم `defaultQueryTimeoutMs` في مهل استعلام Baileys.
- تتطلب الإرسالات الصادرة مستمع WhatsApp نشطًا للحساب الهدف.
- يتم تجاهل محادثات الحالة والبث (`@status`، `@broadcast`).
- يتبع مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس فقط حجم رسائل التطبيق الواردة: تبقى جلسات الأجهزة المرتبطة الهادئة قائمة ما دامت إطارات النقل مستمرة، لكن توقف النقل يفرض إعادة الاتصال قبل وقت طويل من مسار قطع الاتصال البعيد اللاحق.
- تستخدم المحادثات المباشرة قواعد جلسة الرسائل المباشرة (`session.dmScope`؛ يدمج الإعداد الافتراضي `main` الرسائل المباشرة في الجلسة الرئيسية للوكيل).
- جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يحترم نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / الصيغ بالأحرف الصغيرة). فضّل إعداد الوكيل على مستوى المضيف على إعدادات وكيل WhatsApp الخاصة بالقناة.
- عند تمكين `messages.removeAckAfterReply`، تمسح OpenClaw تفاعل إقرار WhatsApp بعد تسليم رد مرئي.

## خطافات Plugin والخصوصية

يمكن أن تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية، وأرقام هواتف،
ومعرّفات مجموعات، وأسماء مرسلين، وحقول ربط جلسات. لهذا السبب،
لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى plugins
إلا إذا اشتركت صراحةً:

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

يمكنك حصر الاشتراك بحساب واحد:

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

فعّل هذا فقط لـ plugins التي تثق بها لتلقي محتوى رسائل WhatsApp الواردة
والمعرّفات.

## التحكم في الوصول والتنشيط

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى الدردشة المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقامًا بنمط E.164 (تتم تسويتها داخليًا).

    تجاوز الحسابات المتعددة: `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) لهما أولوية على الإعدادات الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك التشغيل:

    - تستمر عمليات الاقتران في مخزن السماح الخاص بالقناة وتُدمج مع `allowFrom` المكوّن
    - إذا لم تُكوّن أي قائمة سماح، يُسمح بالرقم الذاتي المرتبط افتراضيًا
    - لا تقوم OpenClaw أبدًا بالاقتران التلقائي لرسائل `fromMe` المباشرة الصادرة (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    يتكون الوصول إلى المجموعات من طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا حُذف `groups`، تكون كل المجموعات مؤهلة
       - إذا كان `groups` موجودًا، فإنه يعمل كقائمة سماح للمجموعات (يُسمح بـ `"*"`)

    2. **سياسة مرسلي المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: تجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الوارد من المجموعات

    الرجوع لقائمة سماح المرسلين:

    - إذا لم يُضبط `groupAllowFrom`، يرجع التشغيل إلى `allowFrom` عند توفره
    - تُقيّم قوائم سماح المرسلين قبل التنشيط بالذكر/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` إطلاقًا، فإن الرجوع التشغيلي لسياسة المجموعات يكون `allowlist` (مع سجل تحذير)، حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب ردود المجموعات إشارة افتراضيًا.

    يتضمن اكتشاف الإشارة:

    - إشارات WhatsApp صريحة إلى هوية الروبوت
    - أنماط regex للإشارة مكوّنة (`agents.list[].groupChat.mentionPatterns`، والرجوع إلى `messages.groupChat.mentionPatterns`)
    - نصوص الملاحظات الصوتية الواردة لرسائل المجموعات المصرح بها
    - اكتشاف ضمني للرد على الروبوت (يطابق مرسل الرد هوية الروبوت)

    ملاحظة أمنية:

    - يفي الاقتباس/الرد بشرط بوابة الإشارة فقط؛ ولا يمنح تفويضًا للمرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير الموجودين في قائمة السماح محظورين حتى إذا ردوا على رسالة مستخدم موجود في قائمة السماح

    أمر التنشيط على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس الإعداد العام). وهو مقيد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والمحادثة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، تُفعّل ضمانات المحادثة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لأدوار المحادثة الذاتية
- تجاهل سلوك التشغيل التلقائي لـ mention-JID الذي كان سيؤدي بخلاف ذلك إلى تنبيه نفسك
- إذا لم يُضبط `messages.responsePrefix`، تكون ردود المحادثة الذاتية افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تسوية الرسائل والسياق

<AccordionGroup>
  <Accordion title="الغلاف الوارد + سياق الرد">
    تُغلّف رسائل WhatsApp الواردة في الغلاف الوارد المشترك.

    إذا وجد رد مقتبس، يُلحق السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُملأ حقول بيانات تعريف الرد أيضًا عند توفرها (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، JID/E.164 للمرسل).

  </Accordion>

  <Accordion title="عناصر نائبة للوسائط واستخراج الموقع/جهة الاتصال">
    تُسوّى الرسائل الواردة التي تحتوي على وسائط فقط بعناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تُنسخ الملاحظات الصوتية للمجموعات المصرح بها قبل بوابة الإشارة عندما يكون
    النص هو فقط `<media:audio>`، لذلك يمكن أن يؤدي قول إشارة الروبوت في الملاحظة الصوتية إلى
    تشغيل الرد. إذا كان النص المنسوخ لا يزال لا يذكر الروبوت، فيُحتفظ
    بالنص المنسوخ في سجل المجموعة المعلق بدلًا من العنصر النائب الخام.

    تستخدم نصوص الموقع نص إحداثيات موجزًا. تُعرض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات تعريف غير موثوقة ضمن سياج، وليس كنص مطالبة مضمّن.

  </Accordion>

  <Accordion title="حقن سجل المجموعة المعلق">
    بالنسبة للمجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عند تشغيل الروبوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الرجوع: `messages.groupChat.historyLimit`
    - `0` يعطّل

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="إيصالات القراءة">
    تكون إيصالات القراءة مفعلة افتراضيًا لرسائل WhatsApp الواردة المقبولة.

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

    تتخطى أدوار المحادثة الذاتية إيصالات القراءة حتى عند تمكينها عالميًا.

  </Accordion>
</AccordionGroup>

## التسليم والتقسيم والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص">
    - حد التقسيم الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يرجع إلى تقسيم آمن من حيث الطول

  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - تُرسل وسائط الصوت عبر حمولة Baileys ‏`audio` مع `ptt: true`، لذلك تعرضها عملاء WhatsApp كملاحظة صوتية اضغط للتحدث
    - تحافظ حمولات الرد على `audioAsVoice`؛ يبقى إخراج الملاحظات الصوتية عبر TTS لـ WhatsApp على مسار PTT هذا حتى عندما يعيد المزوّد MP3 أو WebM
    - يُرسل صوت Ogg/Opus الأصلي كـ `audio/ogg; codecs=opus` للتوافق مع الملاحظات الصوتية
    - يُحوّل الصوت غير Ogg، بما في ذلك إخراج Microsoft Edge TTS بصيغ MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي القناة بتردد 48 كيلوهرتز قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد من المساعد كملاحظة صوتية واحدة ويمنع الإرسال المتكرر للرد نفسه؛ يتحكم `/tts chat on|off|default` في TTS التلقائي لدردشة WhatsApp الحالية
    - تشغيل GIF المتحرك مدعوم عبر `gifPlayback: true` عند إرسال الفيديو
    - تُطبق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط، باستثناء ملاحظات PTT الصوتية إذ يُرسل الصوت أولًا والنص المرئي بشكل منفصل لأن عملاء WhatsApp لا تعرض تسميات الملاحظات الصوتية بشكل متسق
    - يمكن أن يكون مصدر الوسائط HTTP(S) أو `file://` أو مسارات محلية

  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الرجوع الاحتياطي">
    - حد حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - حد إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسّن الصور تلقائيًا (تغيير الحجم/مسح الجودة) لتناسب الحدود
    - عند فشل إرسال الوسائط، يرسل رجوع احتياطي للعنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الرد

يدعم WhatsApp اقتباس الردود الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم فيه باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | لا تقتبس أبدًا؛ أرسل كرسالة عادية                                  |
| `"first"`   | اقتبس أول جزء رد صادر فقط                             |
| `"all"`     | اقتبس كل جزء رد صادر                                      |
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

يتحكم `channels.whatsapp.reactionLevel` في مدى اتساع استخدام الوكيل لتفاعلات emoji على WhatsApp:

| المستوى         | تفاعلات الإقرار | تفاعلات يبدأها الوكيل | الوصف                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | لا            | لا                        | لا توجد تفاعلات إطلاقًا                              |
| `"ack"`       | نعم           | لا                        | تفاعلات الإقرار فقط (إيصال قبل الرد)           |
| `"minimal"`   | نعم           | نعم (محافظ)        | إقرار + تفاعلات الوكيل مع إرشادات محافظة |
| `"extensive"` | نعم           | نعم (مشجّع)          | إقرار + تفاعلات الوكيل مع إرشادات مشجعة   |

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

يدعم WhatsApp تفاعلات إقرار فورية عند استلام الوارد عبر `channels.whatsapp.ackReaction`.
تخضع تفاعلات الإقرار لـ `reactionLevel` — إذ تُمنع عندما يكون `reactionLevel` هو `"off"`.

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

- تُرسل فورًا بعد قبول الوارد (قبل الرد)
- تُسجّل الإخفاقات لكنها لا تمنع تسليم الرد العادي
- يتفاعل وضع المجموعة `mentions` عند الأدوار التي تُشغّلها الإشارة؛ يعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp ‏`channels.whatsapp.ackReaction` (لا يُستخدم `messages.ackReaction` القديم هنا)

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والإعدادات الافتراضية">
    - تأتي معرّفات الحساب من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودًا، وإلا فأول معرّف حساب مكوّن (مرتّب)
    - تُطبّع معرّفات الحساب داخليًا للبحث

  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق القديم">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا تزال مصادقة الوضع الافتراضي القديمة في `~/.openclaw/credentials/` معروفة/مُرحّلة لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يمحو `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب.

    في أدلة المصادقة القديمة، يُحافظ على `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات الإعدادات

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp ‏(`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- كتابات الإعدادات التي تبدأها القناة مفعّلة افتراضيًا (عطّلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (مطلوب QR)">
    العَرَض: تُبلغ حالة القناة أنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكنه مفصول / حلقة إعادة اتصال">
    العَرَض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    يمكن أن تبقى الحسابات الهادئة متصلة بعد مهلة الرسائل العادية؛ يعيد مراقب السلامة
    التشغيل عندما يتوقف نشاط نقل WhatsApp Web، أو يُغلق المقبس، أو
    يظل النشاط على مستوى التطبيق صامتًا بعد نافذة الأمان الأطول.

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

    عند الحاجة، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="تنتهي مهلة تسجيل الدخول عبر QR خلف وكيل">
    العَرَض: يفشل `openclaw channels login --channel whatsapp` قبل إظهار رمز QR قابل للاستخدام مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل دخول WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway ‏(`HTTPS_PROXY` و`HTTP_PROXY` والمتغيرات ذات الأحرف الصغيرة و`NO_PROXY`). تحقق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل الإرسالات الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway قيد التشغيل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يظهر الرد في النص المنسوخ لكن ليس في WhatsApp">
    تسجل صفوف النص المنسوخ ما أنشأه الوكيل. يتم فحص تسليم WhatsApp بشكل منفصل: لا يعتبر OpenClaw الرد التلقائي مرسلًا إلا بعد أن يعيد Baileys معرّف رسالة صادرة لإرسال نص مرئي أو وسائط واحد على الأقل.

    تفاعلات الإقرار إيصالات مستقلة قبل الرد. لا يثبت التفاعل الناجح أن الرد النصي أو رد الوسائط اللاحق قُبل من WhatsApp.

    تحقق من سجلات Gateway بحثًا عن `auto-reply delivery failed` أو `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="تُتجاهل رسائل المجموعة بشكل غير متوقع">
    تحقق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارات (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` (JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذلك احتفظ بـ `groupPolicy` واحد لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    ينبغي أن يستخدم وقت تشغيل WhatsApp Gateway ‏Node. يُعلّم Bun كغير متوافق لتشغيل WhatsApp/Telegram Gateway المستقر.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات نظام على نمط Telegram للمجموعات والدردشات المباشرة عبر خرائط `groups` و`direct`.

تسلسل الحل الهرمي لرسائل المجموعة:

تُحدد خريطة `groups` الفعالة أولًا: إذا عرّف الحساب `groups` الخاصة به، فإنها تستبدل خريطة `groups` الجذرية بالكامل (دون دمج عميق). ثم يعمل البحث عن المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة نظام خاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحدد موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يُمنع حرف البدل ولا تُطبق أي مطالبة نظام.
2. **مطالبة نظام حرف بدل للمجموعة** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

تسلسل الحل الهرمي للرسائل المباشرة:

تُحدد خريطة `direct` الفعالة أولًا: إذا عرّف الحساب `direct` الخاصة به، فإنها تستبدل خريطة `direct` الجذرية بالكامل (دون دمج عميق). ثم يعمل البحث عن المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة نظام خاصة بالمباشر** (`direct["<peerId>"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يُمنع حرف البدل ولا تُطبق أي مطالبة نظام.
2. **مطالبة نظام حرف بدل للمباشر** (`direct["*"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

<Note>
يبقى `dms` حاوية تجاوز السجل الخفيفة لكل DM ‏(`dms.<id>.historyLimit`). تعيش تجاوزات المطالبات ضمن `direct`.
</Note>

**الاختلاف عن سلوك الحسابات المتعددة في Telegram:** في Telegram، تُمنع `groups` الجذرية عمدًا لكل الحسابات في إعداد متعدد الحسابات — حتى الحسابات التي لا تعرّف `groups` خاصة بها — لمنع البوت من تلقي رسائل مجموعات لمجموعات لا ينتمي إليها. لا يطبق WhatsApp هذا الحارس: تُورث `groups` الجذرية و`direct` الجذرية دائمًا بواسطة الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المكوّنة. في إعداد WhatsApp متعدد الحسابات، إذا أردت مطالبات مجموعة أو مباشرة لكل حساب، فعرّف الخريطة الكاملة ضمن كل حساب صراحة بدلًا من الاعتماد على الإعدادات الافتراضية على مستوى الجذر.

السلوك المهم:

- يُعدّ `channels.whatsapp.groups` خريطة تكوين لكل مجموعة وقائمة السماح للمجموعات على مستوى الدردشة في الوقت نفسه. سواءً على نطاق الجذر أو الحساب، فإن `groups["*"]` تعني "يُسمح لجميع المجموعات" لذلك النطاق.
- لا تضف مجموعة بدل `systemPrompt` إلا عندما تريد بالفعل أن يسمح ذلك النطاق بجميع المجموعات. إذا كنت ما زلت تريد أن تكون الأهلية مقتصرة على مجموعة ثابتة من معرّفات المجموعات، فلا تستخدم `groups["*"]` كإعداد افتراضي للموجّه. بدلاً من ذلك، كرر الموجّه في كل إدخال مجموعة مسموح به صراحةً.
- قبول المجموعات وتفويض المرسلين فحصان منفصلان. توسّع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنها لا تفوّض كل مرسل في تلك المجموعات بذاتها. ما يزال وصول المرسلين مضبوطاً بشكل منفصل عبر `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` التأثير الجانبي نفسه للرسائل المباشرة. لا يوفّر `direct["*"]` إلا تكويناً افتراضياً للدردشة المباشرة بعد قبول الرسالة المباشرة مسبقاً بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الاقتران.

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

- الوصول: `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`
- التسليم: `textChunkLimit`، `chunkMode`، `mediaMaxMb`، `sendReadReceipts`، `ackReaction`، `reactionLevel`
- تعدد الحسابات: `accounts.<id>.enabled`، `accounts.<id>.authDir`، التجاوزات على مستوى الحساب
- العمليات: `configWrites`، `debounceMs`، `web.enabled`، `web.heartbeatSeconds`، `web.reconnect.*`، `web.whatsapp.*`
- سلوك الجلسة: `session.dmScope`، `historyLimit`، `dmHistoryLimit`، `dms.<id>.historyLimit`
- الموجّهات: `groups.<id>.systemPrompt`، `groups["*"].systemPrompt`، `direct.<id>.systemPrompt`، `direct["*"].systemPrompt`

## ذات صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
