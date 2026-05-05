---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:16:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

الحالة: جاهز للإنتاج عبر WhatsApp Web (Baileys). يتولى Gateway ملكية الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يطلب مسار التهيئة (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  تثبيت WhatsApp plugin في أول مرة تختاره.
- يوفر `openclaw channels login --channel whatsapp` أيضًا مسار التثبيت عندما
  لا يكون plugin موجودًا بعد.
- قناة التطوير + نسخة git: تكون افتراضيًا على مسار plugin المحلي.
- Stable/Beta: يستخدم حزمة npm `@openclaw/whatsapp` على وسم الإصدار الرسمي
  الحالي.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

استخدم الحزمة المجرّدة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا دقيقًا
فقط عندما تحتاج إلى تثبيت قابل للتكرار.

على Windows، يحتاج WhatsApp plugin إلى وجود Git في `PATH` أثناء تثبيت npm لأن
إحدى تبعيات Baileys/libsignal الخاصة به تُجلب من عنوان URL خاص بـ git. ثبّت
Git for Windows، ثم أعد تشغيل الصدفة وأعد تشغيل التثبيت:

```powershell
winget install --id Git.Git -e
```

يعمل Portable Git أيضًا إذا كان دليل `bin` الخاص به موجودًا في `PATH`.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الإقران للمرسلين غير المعروفين.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات ودفاتر إصلاح.
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

    تنتهي صلاحية طلبات الإقران بعد ساعة واحدة. تُحد الطلبات المعلقة إلى 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل عندما يكون ذلك ممكنًا. (بيانات تعريف القناة ومسار الإعداد محسّنان لهذا الإعداد، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    هذا هو أنظف وضع تشغيلي:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح للرسائل المباشرة وحدود توجيه أوضح
    - احتمال أقل للالتباس مع المحادثة الذاتية

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
    تدعم التهيئة وضع الرقم الشخصي وتكتب أساسًا ملائمًا للمحادثة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تعتمد وسائل حماية المحادثة الذاتية على رقم الذات المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    قناة منصة المراسلة مبنية على WhatsApp Web (`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة Twilio WhatsApp منفصلة في سجل قنوات الدردشة المضمّن.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يتولى Gateway ملكية مقبس WhatsApp وحلقة إعادة الاتصال.
- يستخدم مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط، لذلك لا تُعاد تهيئة جلسة جهاز مرتبط هادئة لمجرد أن أحدًا لم يرسل رسالة مؤخرًا. لا يزال حد صمت أطول على مستوى التطبيق يفرض إعادة الاتصال إذا استمرت إطارات النقل في الوصول لكن لم تُعالج أي رسائل تطبيق خلال نافذة المراقب؛ وبعد إعادة اتصال عابرة لجلسة نشطة مؤخرًا، يستخدم فحص صمت التطبيق هذا مهلة الرسائل العادية لنافذة الاسترداد الأولى.
- توقيتات مقبس Baileys صريحة ضمن `web.whatsapp.*`: يتحكم `keepAliveIntervalMs` في نبضات تطبيق WhatsApp Web، ويتحكم `connectTimeoutMs` في مهلة مصافحة الفتح، ويتحكم `defaultQueryTimeoutMs` في مهل استعلامات Baileys.
- تتطلب عمليات الإرسال الصادرة مستمع WhatsApp نشطًا للحساب الهدف.
- تُرفق عمليات الإرسال إلى المجموعات بيانات تعريف الإشارات الأصلية لرموز `@+<digits>` و`@<digits>` في النص وتعليقات الوسائط عندما يطابق الرمز بيانات تعريف مشارك WhatsApp الحالية، بما في ذلك المجموعات المدعومة بـ LID.
- يتم تجاهل محادثات الحالة والبث (`@status`, `@broadcast`).
- يتبع مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط: تبقى جلسات الأجهزة المرتبطة الهادئة قائمة ما دامت إطارات النقل مستمرة، لكن توقف النقل يفرض إعادة الاتصال قبل مسار قطع الاتصال البعيد اللاحق بكثير.
- تستخدم المحادثات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ يدمج الافتراضي `main` الرسائل المباشرة في جلسة الوكيل الرئيسية).
- جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يمكن أن تكون WhatsApp Channels/Newsletters أهدافًا صادرة صريحة باستخدام JID الأصلي `@newsletter`. تستخدم الإرسالات الصادرة إلى النشرات الإخبارية بيانات تعريف جلسة القناة (`agent:<agentId>:whatsapp:channel:<jid>`) بدل دلالات جلسات الرسائل المباشرة.
- يراعي نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / المتغيرات بالأحرف الصغيرة). فضّل إعداد الوكيل على مستوى المضيف على إعدادات وكيل WhatsApp الخاصة بالقناة.
- عند تفعيل `messages.removeAckAfterReply`، يمسح OpenClaw تفاعل إقرار WhatsApp بعد تسليم رد مرئي.

## خطافات Plugin والخصوصية

يمكن أن تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية، وأرقام هاتف،
ومعرفات مجموعات، وأسماء مرسلين، وحقول ربط جلسات. لهذا السبب،
لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى plugins
إلا إذا اخترت ذلك صراحةً:

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
ومعرفاتها.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى المحادثات المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقامًا بنمط E.164 (تُطبّع داخليًا).

    `allowFrom` هو قائمة تحكم بالوصول لمرسلي الرسائل المباشرة. لا يتحكم في عمليات الإرسال الصادرة الصريحة إلى JIDs مجموعات WhatsApp أو JIDs قنوات `@newsletter`.

    تجاوز الحسابات المتعددة: تكون لـ `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) الأسبقية على افتراضيات مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفظ عمليات الإقران في مخزن سماح القناة وتُدمج مع `allowFrom` المكوّن
    - تستخدم الأتمتة المجدولة والرجوع الاحتياطي لمستلمي Heartbeat أهداف تسليم صريحة أو `allowFrom` المكوّن؛ لا تُعد موافقات إقران الرسائل المباشرة مستلمي Cron أو Heartbeat ضمنيين
    - إذا لم تُكوَّن قائمة سماح، يُسمح برقم الذات المرتبط افتراضيًا
    - لا يُقرن OpenClaw تلقائيًا رسائل `fromMe` المباشرة الصادرة (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="Group policy + allowlists">
    يتكون الوصول إلى المجموعات من طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا حُذف `groups`، تكون كل المجموعات مؤهلة
       - إذا وُجد `groups`، يعمل كقائمة سماح للمجموعات (`"*"` مسموح)

    2. **سياسة مرسلي المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتم تجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الرسائل الواردة من المجموعات

    الرجوع الاحتياطي لقائمة سماح المرسلين:

    - إذا لم يُعيَّن `groupAllowFrom`، يرجع وقت التشغيل إلى `allowFrom` عند توفره
    - تُقيَّم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` إطلاقًا، يكون الرجوع الاحتياطي لسياسة المجموعات في وقت التشغيل هو `allowlist` (مع سجل تحذير)، حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا.

  </Tab>

  <Tab title="Mentions + /activation">
    تتطلب ردود المجموعات إشارة افتراضيًا.

    يشمل اكتشاف الإشارات:

    - إشارات WhatsApp الصريحة إلى هوية الروبوت
    - أنماط regex للإشارات المكوّنة (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`)
    - نسخ الملاحظات الصوتية الواردة لرسائل المجموعات المصرّح بها
    - اكتشاف الرد الضمني على الروبوت (يطابق مرسل الرد هوية الروبوت)

    ملاحظة أمنية:

    - يفي الاقتباس/الرد ببوابة الإشارة فقط؛ ولا يمنح تفويضًا للمرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير المدرجين في قائمة السماح محظورين حتى إذا ردوا على رسالة مستخدم مدرج في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس الإعداد العام). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والمحادثة الذاتية

عندما يكون رقم الذات المرتبط موجودًا أيضًا في `allowFrom`، تُفعّل وسائل حماية المحادثة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لأدوار المحادثة الذاتية
- تجاهل سلوك التشغيل التلقائي عبر mention-JID الذي كان سيشير إلى نفسك لولا ذلك
- إذا لم يُعيَّن `messages.responsePrefix`، تكون ردود المحادثة الذاتية افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    تُغلّف رسائل WhatsApp الواردة في الغلاف الوارد المشترك.

    إذا وجد رد مقتبس، يُلحق السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُملأ حقول بيانات تعريف الرد أيضًا عند توفرها (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).
    عندما يكون هدف الرد المقتبس وسائط قابلة للتنزيل، يحفظه OpenClaw عبر
    مخزن الوسائط الواردة العادي ويعرضه كـ `MediaPath`/`MediaType` حتى
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

    تُنسخ الملاحظات الصوتية المصرّح بها في المجموعات قبل بوابة الإشارة عندما
    يكون النص الأساسي هو `<media:audio>` فقط، لذا يمكن أن يؤدي قول إشارة الروبوت في الملاحظة الصوتية إلى
    تشغيل الرد. إذا كان النص المنسوخ لا يزال لا يشير إلى الروبوت، يُحفظ
    النص المنسوخ في سجل المجموعة المعلق بدلًا من العنصر النائب الخام.

    تستخدم أجسام المواقع نص إحداثيات مقتضبًا. تُعرض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات تعريف غير موثوقة داخل كتل مسيّجة، وليس كنص مطالبة مضمّن.

  </Accordion>

  <Accordion title="Pending group history injection">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يُشغّل الروبوت أخيرًا.

    - الحد الافتراضي: `50`
    - التهيئة: `channels.whatsapp.historyLimit`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - `0` يعطّل

    علامات الحقن:

    - `[رسائل الدردشة منذ آخر رد لك - للسياق]`
    - `[الرسالة الحالية - رد على هذه]`

  </Accordion>

  <Accordion title="Read receipts">
    يتم تمكين إيصالات القراءة افتراضيا لرسائل WhatsApp الواردة المقبولة.

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

    تتخطى دورات الدردشة الذاتية إيصالات القراءة حتى عند تمكينها عالميا.

  </Accordion>
</AccordionGroup>

## التسليم، والتقسيم إلى أجزاء، والوسائط

<AccordionGroup>
  <Accordion title="Text chunking">
    - حد الجزء الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى تقسيم آمن من حيث الطول

  </Accordion>

  <Accordion title="Outbound media behavior">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية بنمط اضغط للتحدث) والمستندات
    - تُرسل الوسائط الصوتية عبر حمولة `audio` في Baileys مع `ptt: true`، لذلك تعرضها عملاء WhatsApp كملاحظة صوتية بنمط اضغط للتحدث
    - تحتفظ حمولات الرد بـ `audioAsVoice`؛ يبقى إخراج الملاحظات الصوتية من تحويل النص إلى كلام في WhatsApp على هذا المسار بنمط اضغط للتحدث حتى عندما يعيد المزوّد MP3 أو WebM
    - يُرسل صوت Ogg/Opus الأصلي كـ `audio/ogg; codecs=opus` لتوافق الملاحظات الصوتية
    - يُحوّل الصوت غير Ogg، بما في ذلك إخراج تحويل النص إلى كلام من Microsoft Edge بصيغ MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي القناة بتردد 48 كيلوهرتز قبل التسليم بنمط اضغط للتحدث
    - يرسل `/tts latest` أحدث رد من المساعد كملاحظة صوتية واحدة ويمنع الإرسال المتكرر للرد نفسه؛ يتحكم `/tts chat on|off|default` في التحويل التلقائي من النص إلى كلام لدردشة WhatsApp الحالية
    - يُدعم تشغيل GIF المتحرك عبر `gifPlayback: true` في عمليات إرسال الفيديو
    - تُطبّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط، باستثناء الملاحظات الصوتية بنمط اضغط للتحدث التي ترسل الصوت أولا والنص المرئي بشكل منفصل لأن عملاء WhatsApp لا يعرضون تسميات الملاحظات الصوتية باستمرار
    - يمكن أن يكون مصدر الوسائط HTTP(S)، أو `file://`، أو مسارات محلية

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - حد حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - حد إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسّن الصور تلقائيا (تغيير الحجم/مسح الجودة) لتلائم الحدود
    - عند فشل إرسال الوسائط، يرسل الاحتياطي للعنصر الأول تحذيرا نصيا بدلا من إسقاط الاستجابة بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الردود

يدعم WhatsApp اقتباس الردود الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكّم به باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | عدم الاقتباس مطلقا؛ الإرسال كرسالة عادية                                  |
| `"first"`   | اقتباس أول جزء فقط من الرد الصادر                             |
| `"all"`     | اقتباس كل جزء من الرد الصادر                                      |
| `"batched"` | اقتباس الردود المجمّعة في الطابور مع ترك الردود الفورية دون اقتباس |

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
| `"minimal"`   | نعم           | نعم (متحفظ)        | الإقرار + تفاعلات الوكيل بتوجيه متحفظ |
| `"extensive"` | نعم           | نعم (مشجّع)          | الإقرار + تفاعلات الوكيل بتوجيه مشجّع   |

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
تخضع تفاعلات الإقرار لـ `reactionLevel` — يتم كبتها عندما تكون `reactionLevel` هي `"off"`.

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

- تُرسل فورا بعد قبول الوارد (قبل الرد)
- تُسجّل الإخفاقات لكنها لا تمنع تسليم الرد العادي
- يتفاعل وضع المجموعة `mentions` في الدورات التي تُشغّل بالذكر؛ يعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp `channels.whatsapp.ackReaction` (لا يُستخدم `messages.ackReaction` القديم هنا)

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - تأتي معرفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودا، وإلا فأول معرف حساب مهيأ (بعد الفرز)
    - تُطبّع معرفات الحسابات داخليا للبحث

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا تزال المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` معروفة/تُرحّل لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="Logout behavior">
    يمسح `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب.

    عندما يكون Gateway قابلًا للوصول، يوقف تسجيل الخروج أولًا مستمع WhatsApp النشط للحساب المحدد حتى لا تستمر الجلسة المرتبطة في تلقي الرسائل إلى حين إعادة التشغيل التالية. يوقف `openclaw channels remove --channel whatsapp` أيضًا المستمع النشط قبل تعطيل تهيئة الحساب أو حذفها.

    في أدلة المصادقة القديمة، يتم الاحتفاظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات التهيئة

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp ‏(`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تُفعّل كتابات التهيئة التي تبدأها القناة افتراضيًا (عطّلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (يلزم رمز QR)">
    العَرَض: تُبلغ حالة القناة بأنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكنه غير متصل / حلقة إعادة اتصال">
    العَرَض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    يمكن أن تبقى الحسابات الهادئة متصلة بعد مهلة الرسائل العادية؛ يُعاد تشغيل المراقب
    عندما يتوقف نشاط نقل WhatsApp Web، أو يُغلق المقبس، أو
    يبقى النشاط على مستوى التطبيق صامتًا بعد نافذة الأمان الأطول.

    إذا أظهرت السجلات تكرار `status=408 Request Time-out Connection was lost`، فاضبط
    توقيتات مقبس Baileys ضمن `web.whatsapp`. ابدأ بتقصير
    `keepAliveIntervalMs` ليكون أقل من مهلة الخمول في شبكتك وزيادة
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
    `openclaw gateway status` و `openclaw channels status --probe` يبيّنان أن
    Gateway وWhatsApp بحالة سليمة، فشغّل `openclaw doctor`. على Linux، يحذّر doctor
    من إدخالات crontab القديمة التي لا تزال تستدعي
    `~/.openclaw/bin/ensure-whatsapp.sh`؛ أزل تلك الإدخالات القديمة باستخدام
    `crontab -e` لأن cron قد يفتقر إلى بيئة ناقل مستخدم systemd ويمكن أن
    يجعل ذلك السكربت القديم يبلّغ عن صحة Gateway بشكل خاطئ.

    عند الحاجة، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="تنتهي مهلة تسجيل الدخول برمز QR خلف وكيل">
    العَرَض: يفشل `openclaw channels login --channel whatsapp` قبل عرض رمز QR قابل للاستخدام مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل دخول WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway (`HTTPS_PROXY` و`HTTP_PROXY` والمتغيرات المناظرة بالأحرف الصغيرة و`NO_PROXY`). تحقق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل عمليات الإرسال الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يظهر الرد في النص المكتوب لكن لا يظهر في WhatsApp">
    تسجل صفوف النص المكتوب ما أنشأه الوكيل. يُفحص تسليم WhatsApp على حدة: لا يعد OpenClaw الرد التلقائي مُرسلًا إلا بعد أن يرجع Baileys معرّف رسالة صادرة لعملية إرسال نص مرئي أو وسائط واحدة على الأقل.

    تفاعلات الإقرار هي إيصالات مستقلة تسبق الرد. نجاح التفاعل لا يثبت أن الرد النصي أو رد الوسائط اللاحق قُبل من WhatsApp.

    تحقق من سجلات Gateway بحثًا عن `auto-reply delivery failed` أو `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="تُتجاهل رسائل المجموعة على نحو غير متوقع">
    تحقق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارات (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` ‏(JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذا احتفظ بـ `groupPolicy` واحد لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    ينبغي أن يستخدم وقت تشغيل WhatsApp gateway Node. يُعلّم Bun بأنه غير متوافق مع التشغيل المستقر لـ WhatsApp/Telegram gateway.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات النظام بأسلوب Telegram للمجموعات والمحادثات المباشرة عبر خرائط `groups` و`direct`.

هرمية الحل لرسائل المجموعات:

تُحدَّد خريطة `groups` الفعالة أولًا: إذا كان الحساب يعرّف `groups` الخاصة به، فإنها تستبدل خريطة `groups` الجذرية بالكامل (لا يوجد دمج عميق). ثم يُشغّل البحث عن المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة نظام خاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، فيُحجب حرف البدل ولا تُطبّق أي مطالبة نظام.
2. **مطالبة نظام حرف البدل للمجموعات** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا من الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

هرمية الحل للرسائل المباشرة:

تُحدَّد خريطة `direct` الفعالة أولًا: إذا كان الحساب يعرّف `direct` الخاصة به، فإنها تستبدل خريطة `direct` الجذرية بالكامل (لا يوجد دمج عميق). ثم يُشغّل البحث عن المطالبة على الخريطة المفردة الناتجة:

1. **موجه النظام الخاص بمحادثة مباشرة محددة** (`direct["<peerId>"].systemPrompt`): يُستخدم عندما يكون إدخال النظير المحدد موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، فسيتم كبت حرف البدل ولا يُطبَّق أي موجه نظام.
2. **موجه نظام حرف البدل للمحادثات المباشرة** (`direct["*"].systemPrompt`): يُستخدم عندما يكون إدخال النظير المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

<Note>
يبقى `dms` حاوية خفيفة لتجاوز السجل لكل رسالة مباشرة (`dms.<id>.historyLimit`). توجد تجاوزات الموجهات ضمن `direct`.
</Note>

**الاختلاف عن سلوك الحسابات المتعددة في Telegram:** في Telegram، يتم كبت `groups` الجذر عمدًا لكل الحسابات في إعداد متعدد الحسابات، حتى الحسابات التي لا تعرّف `groups` خاصة بها، وذلك لمنع البوت من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبّق WhatsApp هذا الحارس: تُورَّث `groups` الجذر و`direct` الجذر دائمًا من الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المهيأة. في إعداد WhatsApp متعدد الحسابات، إذا أردت موجهات مجموعات أو محادثات مباشرة لكل حساب، فعرّف الخريطة الكاملة ضمن كل حساب صراحةً بدل الاعتماد على الافتراضيات على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هي خريطة تهيئة لكل مجموعة وقائمة سماح للمجموعات على مستوى الدردشة في الوقت نفسه. في نطاق الجذر أو الحساب، يعني `groups["*"]` أن "كل المجموعات مسموح لها بالدخول" في ذلك النطاق.
- لا تضف `systemPrompt` لمجموعة بحرف بدل إلا عندما تريد بالفعل أن يسمح ذلك النطاق بدخول كل المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كافتراضي للموجه. بدلًا من ذلك، كرر الموجه في كل إدخال مجموعة مسموح به صراحةً.
- قبول المجموعة وتفويض المرسل فحصان منفصلان. يوسّع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنه لا يفوّض بحد ذاته كل مرسل في تلك المجموعات. لا يزال وصول المرسلين مضبوطًا بشكل منفصل بواسطة `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` التأثير الجانبي نفسه للرسائل المباشرة. يوفّر `direct["*"]` فقط تهيئة افتراضية لدردشة مباشرة بعد قبول الرسالة المباشرة بالفعل بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الاقتران.

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

## مؤشرات مرجع التهيئة

المرجع الأساسي:

- [مرجع التهيئة - WhatsApp](/ar/gateway/config-channels#whatsapp)

حقول WhatsApp عالية الأهمية:

- الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- الحسابات المتعددة: `accounts.<id>.enabled`, `accounts.<id>.authDir`, التجاوزات على مستوى الحساب
- العمليات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- سلوك الجلسة: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- الموجهات: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمن](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
