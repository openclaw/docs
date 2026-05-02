---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:41:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

الحالة: جاهز للإنتاج عبر WhatsApp Web (`Baileys`). يتولى Gateway ملكية الجلسة/الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يطالبك الإعداد الأولي (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  بتثبيت Plugin الخاص بـ WhatsApp في المرة الأولى التي تختاره فيها.
- يعرض `openclaw channels login --channel whatsapp` أيضا مسار التثبيت عندما
  لا يكون Plugin موجودا بعد.
- قناة التطوير + git checkout: تستخدم مسار Plugin المحلي افتراضيا.
- Stable/Beta: تستخدم حزمة npm `@openclaw/whatsapp` عند نشر حزمة حالية.

يبقى التثبيت اليدوي متاحا:

```bash
openclaw plugins install @openclaw/whatsapp
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة أو مفقودة، فاستخدم
بناء OpenClaw معبأ حاليا أو نسخة محلية حتى تلحق سلسلة حزم npm.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح.
  </Card>
  <Card title="إعداد Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القناة الكاملة.
  </Card>
</CardGroup>

## إعداد سريع

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

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. تقتصر الطلبات المعلقة على 3 لكل قناة.

  </Step>
</Steps>

<Note>
توصي OpenClaw بتشغيل WhatsApp على رقم منفصل عند الإمكان. (بيانات القناة الوصفية ومسار الإعداد محسنان لهذا الإعداد، لكن إعدادات الرقم الشخصي مدعومة أيضا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو أنظف وضع تشغيلي:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح للرسائل المباشرة وحدود توجيه أوضح
    - احتمال أقل للالتباس في الدردشة الذاتية

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

  <Accordion title="بديل الرقم الشخصي">
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب أساسا مناسبا للدردشة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تعتمد وسائل حماية الدردشة الذاتية على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة مبنية على WhatsApp Web (`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة Twilio WhatsApp منفصلة في سجل قنوات الدردشة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يتولى Gateway ملكية مقبس WhatsApp وحلقة إعادة الاتصال.
- يستخدم مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط، لذلك لا تتم إعادة تشغيل جلسة جهاز مرتبط هادئة لمجرد أن أحدا لم يرسل رسالة مؤخرا. لا يزال حد صمت التطبيق الأطول يفرض إعادة اتصال إذا استمرت إطارات النقل في الوصول لكن لم تتم معالجة أي رسائل تطبيق ضمن نافذة المراقب؛ وبعد إعادة اتصال عابرة لجلسة كانت نشطة مؤخرا، يستخدم فحص صمت التطبيق ذاك مهلة الرسائل العادية لأول نافذة استرداد.
- توقيتات مقبس Baileys صريحة ضمن `web.whatsapp.*`: يتحكم `keepAliveIntervalMs` في نبضات تطبيق WhatsApp Web، ويتحكم `connectTimeoutMs` في مهلة مصافحة الفتح، ويتحكم `defaultQueryTimeoutMs` في مهل استعلام Baileys.
- تتطلب الإرسالات الصادرة مستمع WhatsApp نشطا للحساب الهدف.
- يتم تجاهل دردشات الحالة والبث (`@status`، `@broadcast`).
- يتبع مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط: تبقى جلسات الأجهزة المرتبطة الهادئة عاملة ما دامت إطارات النقل مستمرة، لكن تعطل النقل يفرض إعادة الاتصال قبل وقت طويل من مسار قطع الاتصال البعيد اللاحق.
- تستخدم الدردشات المباشرة قواعد جلسة الرسائل المباشرة (`session.dmScope`؛ القيمة الافتراضية `main` تدمج الرسائل المباشرة في جلسة الوكيل الرئيسية).
- جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يمكن أن تكون قنوات WhatsApp/النشرات الإخبارية أهدافا صادرة صريحة باستخدام JID الأصلي `@newsletter`. تستخدم إرسالات النشرة الإخبارية الصادرة بيانات تعريف جلسة القناة (`agent:<agentId>:whatsapp:channel:<jid>`) بدلا من دلالات جلسة الرسائل المباشرة.
- يحترم نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / المتغيرات بأحرف صغيرة). فضّل إعداد الوكيل على مستوى المضيف بدلا من إعدادات وكيل WhatsApp الخاصة بالقناة.
- عند تمكين `messages.removeAckAfterReply`، يمسح OpenClaw تفاعل الإقرار في WhatsApp بعد تسليم رد مرئي.

## خطافات Plugin والخصوصية

يمكن أن تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية وأرقام هواتف
ومعرفات مجموعات وأسماء مرسلين وحقول ربط الجلسات. لهذا السبب،
لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى plugins
ما لم تفعل الاشتراك صراحة:

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

فعّل هذا فقط لـ plugins التي تثق بها لتلقي محتوى رسائل WhatsApp الواردة
والمعرفات.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى الدردشة المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقاما بنمط E.164 (تتم تسويتها داخليا).

    `allowFrom` هي قائمة تحكم في وصول مرسلي الرسائل المباشرة. لا تتحكم في الإرسالات الصادرة الصريحة إلى JIDs مجموعات WhatsApp أو JIDs قنوات `@newsletter`.

    تجاوز الحسابات المتعددة: تكون `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) ذات أولوية على الإعدادات الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - يتم حفظ عمليات الاقتران في مخزن سماح القناة ودمجها مع `allowFrom` المهيأ
    - تستخدم الأتمتة المجدولة وبديل مستلم Heartbeat أهداف تسليم صريحة أو `allowFrom` المهيأ؛ موافقات اقتران الرسائل المباشرة ليست مستلمين ضمنيين لـ cron أو Heartbeat
    - إذا لم يتم إعداد قائمة سماح، يسمح بالرقم الذاتي المرتبط افتراضيا
    - لا يقوم OpenClaw أبدا بإقران رسائل مباشرة صادرة `fromMe` تلقائيا (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    للوصول إلى المجموعات طبقتان:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا تم حذف `groups`، تكون كل المجموعات مؤهلة
       - إذا كانت `groups` موجودة، فإنها تعمل كقائمة سماح للمجموعات (يسمح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتم تجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الوارد إلى المجموعات

    بديل قائمة سماح المرسلين:

    - إذا لم يتم تعيين `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفره
    - يتم تقييم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم تكن كتلة `channels.whatsapp` موجودة إطلاقا، فإن بديل سياسة المجموعة في وقت التشغيل هو `allowlist` (مع سجل تحذير)، حتى إذا تم تعيين `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب ردود المجموعات إشارة افتراضيا.

    يتضمن اكتشاف الإشارة:

    - إشارات WhatsApp صريحة إلى هوية الروبوت
    - أنماط تعبيرات الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، والبديل `messages.groupChat.mentionPatterns`)
    - نصوص الملاحظات الصوتية الواردة لرسائل المجموعات المصرح بها
    - اكتشاف الرد الضمني على الروبوت (مرسل الرد يطابق هوية الروبوت)

    ملاحظة أمنية:

    - يفي الاقتباس/الرد بشرط بوابة الإشارة فقط؛ ولا يمنح تفويض المرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير الموجودين في قائمة السماح محظورين حتى إذا ردوا على رسالة مستخدم موجود في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدث `activation` حالة الجلسة (وليس الإعداد العام). وهو مقيد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والدردشة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودا أيضا في `allowFrom`، يتم تفعيل وسائل حماية الدردشة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لجولات الدردشة الذاتية
- تجاهل سلوك التشغيل التلقائي عبر mention-JID الذي كان سيؤدي بخلاف ذلك إلى تنبيه نفسك
- إذا لم يتم تعيين `messages.responsePrefix`، فستكون ردود الدردشة الذاتية افتراضيا `[{identity.name}]` أو `[openclaw]`

## تسوية الرسائل والسياق

<AccordionGroup>
  <Accordion title="غلاف الوارد + سياق الرد">
    يتم تغليف رسائل WhatsApp الواردة في غلاف الوارد المشترك.

    إذا كان هناك رد مقتبس، يضاف السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تتم أيضا تعبئة حقول بيانات تعريف الرد عند توفرها (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، JID/E.164 للمرسل).
    عندما يكون هدف الرد المقتبس وسائط قابلة للتنزيل، يحفظه OpenClaw عبر
    مخزن الوسائط الواردة العادي ويعرضه كـ `MediaPath`/`MediaType` حتى
    يتمكن الوكيل من فحص الصورة المشار إليها بدلا من رؤية
    `<media:image>` فقط.

  </Accordion>

  <Accordion title="عناصر الوسائط النائبة واستخراج الموقع/جهة الاتصال">
    تتم تسوية الرسائل الواردة التي تحتوي على وسائط فقط باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    يتم نسخ الملاحظات الصوتية للمجموعات المصرح بها قبل بوابة الإشارة عندما يكون
    المتن هو `<media:audio>` فقط، لذلك يمكن أن يؤدي قول إشارة الروبوت في الملاحظة الصوتية إلى
    تشغيل الرد. إذا ظل النص لا يذكر الروبوت، فسيتم الاحتفاظ
    بالنص في سجل المجموعة المعلق بدلا من العنصر النائب الخام.

    تستخدم متون الموقع نص إحداثيات موجزا. يتم عرض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات وصفية غير موثوقة داخل كتل مسيجة، وليس كنص موجه مضمن.

  </Accordion>

  <Accordion title="حقن سجل المجموعة المعلق">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتا وحقنها كسياق عندما يتم تشغيل الروبوت أخيرا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - البديل: `messages.groupChat.historyLimit`
    - `0` يعطل

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="إيصالات القراءة">
    يتم تمكين إيصالات القراءة افتراضيا لرسائل WhatsApp الواردة المقبولة.

    تعطيلها عالميا:

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

    تتخطى أدوار المحادثة الذاتية إيصالات القراءة حتى عند تمكينها عمومًا.

  </Accordion>
</AccordionGroup>

## التسليم والتجزئة والوسائط

<AccordionGroup>
  <Accordion title="تجزئة النص">
    - حد التجزئة الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التجزئة الآمنة من حيث الطول

  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - تُرسل وسائط الصوت عبر حمولة Baileys `audio` مع `ptt: true`، لذلك تعرضها عملاء WhatsApp كملاحظة صوتية اضغط للتحدث
    - تحافظ حمولات الرد على `audioAsVoice`؛ يظل إخراج الملاحظات الصوتية عبر TTS لـ WhatsApp على مسار PTT هذا حتى عندما يعيد الموفر MP3 أو WebM
    - يُرسل صوت Ogg/Opus الأصلي على أنه `audio/ogg; codecs=opus` للتوافق مع الملاحظات الصوتية
    - يُحوَّل الصوت غير Ogg، بما في ذلك إخراج Microsoft Edge TTS بصيغتي MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي 48 كيلوهرتز قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد من المساعد كملاحظة صوتية واحدة ويمنع الإرسال المتكرر للرد نفسه؛ يتحكم `/tts chat on|off|default` في TTS التلقائي لمحادثة WhatsApp الحالية
    - يُدعم تشغيل GIF المتحرك عبر `gifPlayback: true` في عمليات إرسال الفيديو
    - تُطبَّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط، باستثناء ملاحظات PTT الصوتية التي ترسل الصوت أولًا والنص المرئي بشكل منفصل لأن عملاء WhatsApp لا يعرضون تسميات الملاحظات الصوتية التوضيحية بشكل متسق
    - يمكن أن يكون مصدر الوسائط HTTP(S)، أو `file://`، أو مسارات محلية

  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الرجوع الاحتياطي">
    - حد حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - حد إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسَّن الصور تلقائيًا (تغيير الحجم/تمشيط الجودة) لتناسب الحدود
    - عند فشل إرسال الوسائط، يرسل الرجوع الاحتياطي للعنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الردود

يدعم WhatsApp اقتباس الردود الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم فيه باستخدام `channels.whatsapp.replyToMode`.

| القيمة      | السلوك                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| `"off"`     | لا تقتبس أبدًا؛ أرسل كرسالة عادية                                      |
| `"first"`   | اقتبس فقط أول جزء من الرد الصادر                                       |
| `"all"`     | اقتبس كل جزء من الرد الصادر                                            |
| `"batched"` | اقتبس الردود المجمعة في قائمة الانتظار مع ترك الردود الفورية دون اقتباس |

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

## مستوى التفاعلات

يتحكم `channels.whatsapp.reactionLevel` في مدى استخدام الوكيل لتفاعلات الرموز التعبيرية على WhatsApp:

| المستوى      | تفاعلات الإقرار | التفاعلات التي يبدأها الوكيل | الوصف                                                |
| ------------- | --------------- | ---------------------------- | ---------------------------------------------------- |
| `"off"`       | لا              | لا                           | لا توجد تفاعلات إطلاقًا                              |
| `"ack"`       | نعم             | لا                           | تفاعلات الإقرار فقط (إيصال قبل الرد)                 |
| `"minimal"`   | نعم             | نعم (محافظ)                  | إقرار + تفاعلات الوكيل مع توجيه محافظ                |
| `"extensive"` | نعم             | نعم (مشجّع)                  | إقرار + تفاعلات الوكيل مع توجيه مشجّع                |

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
تخضع تفاعلات الإقرار لـ `reactionLevel` — تُمنع عندما يكون `reactionLevel` هو `"off"`.

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
- تُسجَّل الإخفاقات لكنها لا تمنع تسليم الرد الطبيعي
- يتفاعل وضع المجموعة `mentions` في الأدوار التي تشغّلها الإشارة؛ يعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp `channels.whatsapp.ackReaction` (لا يُستخدم هنا `messages.ackReaction` القديم)

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والافتراضيات">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إن وُجد، وإلا أول معرّف حساب مكوّن (مرتّب)
    - تُطبَّع معرّفات الحسابات داخليًا للبحث

  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق القديم">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا تزال المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` معروفة/مهاجرة لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يمحو `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب.

    عندما يكون Gateway قابلًا للوصول، يوقف تسجيل الخروج أولًا مستمع WhatsApp الحي للحساب المحدد حتى لا تواصل الجلسة المرتبطة تلقي الرسائل حتى إعادة التشغيل التالية. يوقف `openclaw channels remove --channel whatsapp` أيضًا المستمع الحي قبل تعطيل إعدادات الحساب أو حذفها.

    في أدلة المصادقة القديمة، يُحافَظ على `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابة الإعدادات

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp (`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تكون عمليات كتابة الإعدادات التي يبدأها القناة ممكّنة افتراضيًا (عطّلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (رمز QR مطلوب)">
    العَرَض: تُبلغ حالة القناة بأنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكن غير متصل / حلقة إعادة اتصال">
    العَرَض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    يمكن للحسابات الهادئة أن تبقى متصلة بعد مهلة الرسائل العادية؛ يعيد المراقب
    التشغيل عندما يتوقف نشاط نقل WhatsApp Web، أو يُغلق المقبس، أو
    يبقى النشاط على مستوى التطبيق صامتًا بعد نافذة الأمان الأطول.

    إذا أظهرت السجلات تكرار `status=408 Request Time-out Connection was lost`، فاضبط
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
    أظهر `openclaw gateway status` و `openclaw channels status --probe` أن
    Gateway و WhatsApp سليمان، فشغّل `openclaw doctor`. على Linux، يحذّر doctor
    من إدخالات crontab القديمة التي لا تزال تستدعي
    `~/.openclaw/bin/ensure-whatsapp.sh`؛ أزل تلك الإدخالات القديمة باستخدام
    `crontab -e` لأن cron قد يفتقر إلى بيئة ناقل مستخدم systemd ويمكنه
    جعل ذلك السكربت القديم يبلّغ صحة Gateway بشكل خاطئ.

    إذا لزم الأمر، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="تنتهي مهلة تسجيل الدخول عبر QR خلف وكيل">
    العَرَض: يفشل `openclaw channels login --channel whatsapp` قبل إظهار رمز QR صالح للاستخدام مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل دخول WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway (`HTTPS_PROXY`، و`HTTP_PROXY`، والصيغ الصغيرة، و`NO_PROXY`). تحقق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل الإرسالات الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يظهر الرد في النص المنسوخ لكن ليس في WhatsApp">
    تسجل صفوف النص المنسوخ ما أنشأه الوكيل. يُفحص تسليم WhatsApp بشكل منفصل: لا يعتبر OpenClaw الرد التلقائي مُرسلًا إلا بعد أن يعيد Baileys معرّف رسالة صادرة لإرسال نص مرئي واحد أو وسائط مرئية واحدة على الأقل.

    تفاعلات الإقرار هي إيصالات مستقلة قبل الرد. لا يثبت نجاح التفاعل أن الرد النصي أو رد الوسائط اللاحق قُبل بواسطة WhatsApp.

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
    يجب أن يستخدم وقت تشغيل WhatsApp Gateway‏ Node. يُعلَّم Bun بأنه غير متوافق مع التشغيل المستقر لـ WhatsApp/Telegram Gateway.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات النظام بأسلوب Telegram للمجموعات والمحادثات المباشرة عبر خرائط `groups` و`direct`.

تسلسل الحل الهرمي لرسائل المجموعة:

تُحدَّد خريطة `groups` الفعالة أولًا: إذا عرّف الحساب `groups` الخاصة به، فإنها تستبدل خريطة `groups` الجذرية بالكامل (لا يوجد دمج عميق). ثم يجري البحث عن المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة النظام الخاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحدد موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يُمنع حرف البدل ولا تُطبَّق أي مطالبة نظام.
2. **مطالبة النظام لحرف بدل المجموعة** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

تسلسل الحل الهرمي للرسائل المباشرة:

تُحدَّد خريطة `direct` الفعالة أولًا: إذا عرّف الحساب `direct` الخاصة به، فإنها تستبدل خريطة `direct` الجذرية بالكامل (لا يوجد دمج عميق). ثم يجري البحث عن المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة النظام الخاصة بالرسالة المباشرة** (`direct["<peerId>"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يُمنع حرف البدل ولا تُطبَّق أي مطالبة نظام.
2. **مطالبة النظام لحرف بدل الرسالة المباشرة** (`direct["*"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

<Note>
يبقى `dms` حاوية تجاوز سجل خفيفة لكل DM‏ (`dms.<id>.historyLimit`). تعيش تجاوزات المطالبات ضمن `direct`.
</Note>

**الاختلاف عن سلوك Telegram متعدد الحسابات:** في Telegram، يُعطَّل `groups` الجذري عمدًا لجميع الحسابات في إعداد متعدد الحسابات، حتى الحسابات التي لا تعرّف أي `groups` خاصة بها، لمنع البوت من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبّق WhatsApp هذا الحاجز: تُورَّث `groups` الجذرية و`direct` الجذري دائمًا بواسطة الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المكوّنة. في إعداد WhatsApp متعدد الحسابات، إذا كنت تريد مطالبات مجموعات أو رسائل مباشرة لكل حساب، فعرّف الخريطة الكاملة تحت كل حساب صراحة بدلًا من الاعتماد على الافتراضيات على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هي في الوقت نفسه خريطة تكوين لكل مجموعة وقائمة سماح للمجموعات على مستوى المحادثة. في نطاق الجذر أو الحساب، تعني `groups["*"]` "قبول كل المجموعات" لذلك النطاق.
- لا تضف `systemPrompt` لمجموعة بدل شاملة إلا عندما تريد مسبقًا أن يقبل ذلك النطاق كل المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كافتراضي للمطالبة. بدلًا من ذلك، كرر المطالبة في كل إدخال مجموعة مسموح به صراحة.
- قبول المجموعة وتفويض المرسل فحصان منفصلان. توسّع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنها لا تفوّض بذاتها كل مرسل في تلك المجموعات. لا يزال وصول المرسل مضبوطًا بشكل منفصل بواسطة `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- ليس لدى `channels.whatsapp.direct` الأثر الجانبي نفسه للرسائل المباشرة. يوفّر `direct["*"]` فقط تكوينًا افتراضيًا لمحادثة مباشرة بعد قبول الرسالة المباشرة مسبقًا بواسطة `dmPolicy` بالإضافة إلى `allowFrom` أو قواعد مخزن الاقتران.

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
- المطالبات: `groups.<id>.systemPrompt`، `groups["*"].systemPrompt`، `direct.<id>.systemPrompt`، `direct["*"].systemPrompt`

## ذات صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
