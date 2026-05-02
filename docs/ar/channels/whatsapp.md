---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T07:19:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a38b2338056b55364577c72b643dac28ebb0006cdc61b480555e6079fb71573
    source_path: channels/whatsapp.md
    workflow: 16
---

الحالة: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). يتولى Gateway ملكية الجلسة أو الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يطلب الإعداد الأولي (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  تثبيت Plugin الخاص بـ WhatsApp في أول مرة تحدده فيها.
- يتيح `openclaw channels login --channel whatsapp` أيضا تدفق التثبيت عندما
  لا يكون Plugin موجودا بعد.
- قناة التطوير + استخراج git: تستخدم مسار Plugin المحلي افتراضيا.
- Stable/Beta: يستخدم حزمة npm ‏`@openclaw/whatsapp` عندما تكون حزمة حالية
  منشورة.

يبقى التثبيت اليدوي متاحا:

```bash
openclaw plugins install @openclaw/whatsapp
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة أو مفقودة، فاستخدم
بناء OpenClaw حالي معبأ أو نسخة محلية حتى تلحق سلسلة حزم npm.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الإقران للمرسلين غير المعروفين.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح.
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

    تنتهي صلاحية طلبات الإقران بعد ساعة واحدة. وتقتصر الطلبات المعلقة على 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل عندما يكون ذلك ممكنا. (تم تحسين بيانات تعريف القناة وتدفق الإعداد لهذا النمط، لكن إعدادات الرقم الشخصي مدعومة أيضا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    هذا هو أنظف وضع تشغيلي:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح للرسائل المباشرة وحدود توجيه أوضح
    - احتمال أقل للالتباس في المحادثة الذاتية

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
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب أساسا مناسبا للمحادثة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    أثناء التشغيل، تعتمد حماية المحادثة الذاتية على رقم الذات المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    قناة منصة المراسلة مبنية على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة WhatsApp منفصلة عبر Twilio في سجل قنوات المحادثة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج التشغيل

- يتولى Gateway ملكية مقبس WhatsApp وحلقة إعادة الاتصال.
- تستخدم أداة مراقبة إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط، لذلك لا تتم إعادة تشغيل جلسة جهاز مرتبط هادئة لمجرد أن أحدا لم يرسل رسالة مؤخرا. ومع ذلك، يفرض حد أطول لصمت التطبيق إعادة الاتصال إذا استمرت إطارات النقل في الوصول لكن لم تتم معالجة أي رسائل تطبيق خلال نافذة المراقبة؛ وبعد إعادة اتصال عابرة لجلسة كانت نشطة مؤخرا، يستخدم فحص صمت التطبيق هذا مهلة الرسائل العادية لنافذة الاسترداد الأولى.
- توقيتات مقبس Baileys صريحة ضمن `web.whatsapp.*`: يتحكم `keepAliveIntervalMs` في نبضات تطبيق WhatsApp Web، ويتحكم `connectTimeoutMs` في مهلة مصافحة الفتح، ويتحكم `defaultQueryTimeoutMs` في مهل استعلام Baileys.
- تتطلب عمليات الإرسال الصادرة مستمع WhatsApp نشطا للحساب الهدف.
- يتم تجاهل محادثات الحالة والبث (`@status`, `@broadcast`).
- تتبع أداة مراقبة إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط: تبقى جلسات الأجهزة المرتبطة الهادئة عاملة ما دامت إطارات النقل مستمرة، لكن توقف النقل يفرض إعادة الاتصال قبل مسار قطع الاتصال البعيد اللاحق بوقت طويل.
- تستخدم المحادثات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ الإعداد الافتراضي `main` يدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل).
- جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يحترم نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / المتغيرات بحروف صغيرة). فضّل إعداد الوكيل على مستوى المضيف على إعدادات وكيل WhatsApp الخاصة بالقناة.
- عند تفعيل `messages.removeAckAfterReply`، يمحو OpenClaw تفاعل إقرار WhatsApp بعد تسليم رد مرئي.

## خطافات Plugin والخصوصية

يمكن أن تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية، وأرقام هواتف،
ومعرفات مجموعات، وأسماء مرسلين، وحقول ربط جلسات. لهذا السبب،
لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى plugins
إلا إذا اخترت ذلك صراحة:

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

فعّل هذا فقط مع plugins التي تثق بها لتلقي محتوى رسائل WhatsApp الواردة
والمعرفات.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى المحادثات المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقاما بنمط E.164 (تتم تسويتها داخليا).

    تجاوز الحسابات المتعددة: يكون لـ `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) الأسبقية على الإعدادات الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك التشغيل:

    - تستمر عمليات الإقران في مخزن السماح للقناة وتدمج مع `allowFrom` المكوّن
    - تستخدم الأتمتة المجدولة والوجهة الاحتياطية لمستلم Heartbeat أهداف تسليم صريحة أو `allowFrom` المكوّن؛ لا تكون موافقات إقران الرسائل المباشرة مستلمين ضمنيين لـ cron أو Heartbeat
    - إذا لم تكن قائمة السماح مكوّنة، يسمح بالرقم الذاتي المرتبط افتراضيا
    - لا يقارن OpenClaw أبدا تلقائيا الرسائل المباشرة الصادرة `fromMe` (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="Group policy + allowlists">
    لوصول المجموعات طبقتان:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا تم حذف `groups`، تكون كل المجموعات مؤهلة
       - إذا كان `groups` موجودا، فإنه يعمل كقائمة سماح للمجموعات (يسمح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: تجاوز قائمة سماح المرسل
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الوارد من المجموعات

    السلوك الاحتياطي لقائمة سماح المرسل:

    - إذا لم يتم ضبط `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفره
    - تقيّم قوائم سماح المرسلين قبل التفعيل بالذكر/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` إطلاقا، فإن السلوك الاحتياطي لسياسة المجموعة وقت التشغيل هو `allowlist` (مع سجل تحذير)، حتى إذا كان `channels.defaults.groupPolicy` مضبوطا.

  </Tab>

  <Tab title="Mentions + /activation">
    تتطلب ردود المجموعات ذكرا افتراضيا.

    يشمل اكتشاف الذكر:

    - إشارات WhatsApp صريحة إلى هوية البوت
    - أنماط تعبيرات منتظمة مكوّنة للذكر (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - نصوص تفريغ الملاحظات الصوتية الواردة لرسائل المجموعات المصرح بها
    - اكتشاف ضمني للرد على البوت (يطابق مرسل الرد هوية البوت)

    ملاحظة أمنية:

    - يفي الاقتباس/الرد ببوابة الذكر فقط؛ ولا يمنح تفويض المرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير المدرجين في قائمة السماح محظورين حتى إذا ردوا على رسالة مستخدم مدرج في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس الإعداد العام). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والمحادثة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودا أيضا في `allowFrom`، يتم تفعيل احتياطات المحادثة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لدورات المحادثة الذاتية
- تجاهل سلوك التشغيل التلقائي عبر mention-JID الذي كان سيؤدي بخلاف ذلك إلى تنبيه نفسك
- إذا لم يتم ضبط `messages.responsePrefix`، فستكون ردود المحادثة الذاتية افتراضيا `[{identity.name}]` أو `[openclaw]`

## تسوية الرسائل والسياق

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    تُغلّف رسائل WhatsApp الواردة في الغلاف الوارد المشترك.

    إذا كان هناك رد مقتبس، يضاف السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تتم أيضا تعبئة حقول بيانات تعريف الرد عند توفرها (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).
    عندما يكون هدف الرد المقتبس وسائط قابلة للتنزيل، يحفظه OpenClaw عبر
    مخزن الوسائط الواردة العادي ويعرضه كـ `MediaPath`/`MediaType` حتى
    يتمكن الوكيل من فحص الصورة المشار إليها بدلا من رؤية
    `<media:image>` فقط.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    تتم تسوية رسائل الوارد التي تحتوي على وسائط فقط باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    يتم تفريغ الملاحظات الصوتية المصرح بها في المجموعات قبل بوابة الذكر عندما يكون
    النص الأساسي هو `<media:audio>` فقط، لذلك يمكن أن يؤدي ذكر البوت في الملاحظة الصوتية
    إلى تشغيل الرد. إذا ظل النص المفرغ لا يذكر البوت، فيُحتفظ
    بالنص المفرغ في سجل المجموعة المعلق بدلا من العنصر النائب الخام.

    تستخدم نصوص الموقع صياغة مختصرة للإحداثيات. وتعرض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات تعريف غير موثوقة داخل سياج، وليس كنص مطالبة مضمن.

  </Accordion>

  <Accordion title="Pending group history injection">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتا وحقنها كسياق عند تشغيل البوت أخيرا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - `0` يعطل

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

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

    تتخطى دورات المحادثة الذاتية إيصالات القراءة حتى عند تمكينها عالميا.

  </Accordion>
</AccordionGroup>

## التسليم، والتقسيم إلى أجزاء، والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص إلى أجزاء">
    - حد الأجزاء الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التقسيم الآمن بحسب الطول

  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - تُرسل وسائط الصوت عبر حمولة `audio` في Baileys مع `ptt: true`، لذلك تعرضها عملاء WhatsApp كملاحظة صوتية بنمط اضغط للتحدث
    - تحافظ حمولات الرد على `audioAsVoice`؛ يبقى إخراج ملاحظة TTS الصوتية لـ WhatsApp على مسار PTT هذا حتى عندما يعيد المزوّد MP3 أو WebM
    - يُرسل صوت Ogg/Opus الأصلي كـ `audio/ogg; codecs=opus` للتوافق مع الملاحظات الصوتية
    - يُعاد ترميز الصوت غير Ogg، بما في ذلك إخراج Microsoft Edge TTS بصيغ MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي القناة بتردد 48 kHz قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد للمساعد كملاحظة صوتية واحدة ويمنع إعادة الإرسال للرد نفسه؛ يتحكم `/tts chat on|off|default` في TTS التلقائي لمحادثة WhatsApp الحالية
    - تشغيل GIF المتحرك مدعوم عبر `gifPlayback: true` في إرسال الفيديو
    - تُطبّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط، باستثناء ملاحظات PTT الصوتية التي ترسل الصوت أولاً والنص المرئي منفصلاً لأن عملاء WhatsApp لا يعرضون تسميات الملاحظات الصوتية باتساق
    - يمكن أن يكون مصدر الوسائط HTTP(S)، أو `file://`، أو مسارات محلية

  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الرجوع الاحتياطي">
    - حد حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - حد إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسّن الصور تلقائياً (تغيير الحجم/تمشيط الجودة) لتناسب الحدود
    - عند فشل إرسال الوسائط، يرسل الرجوع الاحتياطي للعنصر الأول تحذيراً نصياً بدلاً من إسقاط الرد بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الردود

يدعم WhatsApp اقتباس الردود الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بوضوح. تحكم به باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | لا تقتبس أبداً؛ أرسل كرسالة عادية                                  |
| `"first"`   | اقتبس الجزء الأول فقط من الرد الصادر                             |
| `"all"`     | اقتبس كل جزء من الرد الصادر                                      |
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

| المستوى         | تفاعلات الإقرار | تفاعلات يبدأها الوكيل | الوصف                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | لا            | لا                        | لا توجد تفاعلات على الإطلاق                              |
| `"ack"`       | نعم           | لا                        | تفاعلات الإقرار فقط (إيصال قبل الرد)           |
| `"minimal"`   | نعم           | نعم (محافظ)        | إقرار + تفاعلات الوكيل بإرشاد محافظ |
| `"extensive"` | نعم           | نعم (مشجّع)          | إقرار + تفاعلات الوكيل بإرشاد مشجّع   |

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
تُقيّد تفاعلات الإقرار بواسطة `reactionLevel` — فهي تُحجب عندما يكون `reactionLevel` هو `"off"`.

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

- تُرسل فوراً بعد قبول الوارد (قبل الرد)
- تُسجّل حالات الفشل لكنها لا تحظر تسليم الرد العادي
- يتفاعل وضع المجموعة `mentions` في الأدوار المشغّلة بالذكر؛ يعمل تنشيط المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp `channels.whatsapp.ackReaction` (لا يُستخدم `messages.ackReaction` القديم هنا)

## تعدد الحسابات وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والافتراضيات">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجوداً، وإلا فأول معرّف حساب مهيأ (مرتّب)
    - تُطبّع معرّفات الحسابات داخلياً للبحث

  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق القديم">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا يزال يُتعرّف على المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` وتُرحّل لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يمسح `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب.

    عندما يكون Gateway قابلاً للوصول، يوقف تسجيل الخروج أولاً مستمع WhatsApp الحي للحساب المحدد حتى لا تواصل الجلسة المرتبطة تلقي الرسائل حتى إعادة التشغيل التالية. يوقف `openclaw channels remove --channel whatsapp` أيضاً المستمع الحي قبل تعطيل تهيئة الحساب أو حذفها.

    في أدلة المصادقة القديمة، يُحتفظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات التهيئة

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp (`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- كتابات التهيئة التي تبدأها القناة مفعّلة افتراضياً (عطّلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (رمز QR مطلوب)">
    العَرَض: تُبلغ حالة القناة أنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكنه غير متصل / حلقة إعادة اتصال">
    العَرَض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    يمكن للحسابات الهادئة أن تبقى متصلة بعد مهلة الرسائل العادية؛ يعيد المراقب
    التشغيل عندما يتوقف نشاط نقل WhatsApp Web، أو يُغلق المقبس، أو
    يبقى النشاط على مستوى التطبيق صامتاً بعد نافذة الأمان الأطول.

    إذا أظهرت السجلات تكرار `status=408 Request Time-out Connection was lost`، فاضبط
    توقيتات مقبس Baileys ضمن `web.whatsapp`. ابدأ بتقصير
    `keepAliveIntervalMs` إلى ما دون مهلة الخمول في شبكتك وزيادة
    `connectTimeoutMs` على الروابط البطيئة أو كثيرة الفقدان:

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
    `openclaw gateway status` و `openclaw channels status --probe` يظهران أن
    Gateway وWhatsApp سليمان، فشغّل `openclaw doctor`. على Linux، يحذّر doctor
    من إدخالات crontab القديمة التي ما زالت تستدعي
    `~/.openclaw/bin/ensure-whatsapp.sh`؛ أزل تلك الإدخالات المتقادمة باستخدام
    `crontab -e` لأن Cron قد يفتقر إلى بيئة ناقل مستخدم systemd ويمكن أن
    يجعل ذلك السكربت القديم يبلّغ خطأً عن صحة Gateway.

    إذا لزم الأمر، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="تنتهي مهلة تسجيل الدخول عبر QR خلف وكيل">
    العَرَض: يفشل `openclaw channels login --channel whatsapp` قبل إظهار رمز QR قابل للاستخدام مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل دخول WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway (`HTTPS_PROXY` و`HTTP_PROXY` والمتغيرات ذات الأحرف الصغيرة و`NO_PROXY`). تحقق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل عمليات الإرسال الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يظهر الرد في النص المنسوخ لكن ليس في WhatsApp">
    تسجل صفوف النص المنسوخ ما ولّده الوكيل. يُفحص تسليم WhatsApp بشكل منفصل: لا يعتبر OpenClaw الرد التلقائي مرسلاً إلا بعد أن يعيد Baileys معرّف رسالة صادرة لإرسال نص مرئي أو وسائط واحدة على الأقل.

    تفاعلات الإقرار إيصالات مستقلة قبل الرد. لا يثبت نجاح التفاعل أن الرد النصي أو الوسائطي اللاحق قُبل من WhatsApp.

    تحقق من سجلات Gateway بحثاً عن `auto-reply delivery failed` أو `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="تُتجاهل رسائل المجموعة بشكل غير متوقع">
    تحقق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الذكر (`requireMention` + أنماط الذكر)
    - المفاتيح المكررة في `openclaw.json` (JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذا احتفظ بـ `groupPolicy` واحد لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل WhatsApp gateway Node. يُعلّم Bun كغير متوافق مع تشغيل Gateway مستقر لـ WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات نظام بأسلوب Telegram للمجموعات والمحادثات المباشرة عبر خرائط `groups` و`direct`.

تدرج الحل لرسائل المجموعة:

تُحدد خريطة `groups` الفعالة أولاً: إذا عرّف الحساب `groups` الخاصة به، فإنها تستبدل بالكامل خريطة `groups` الجذرية (من دون دمج عميق). ثم يجري البحث عن المطالبة على الخريطة الواحدة الناتجة:

1. **مطالبة نظام خاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة موجوداً في الخريطة **و** يكون مفتاح `systemPrompt` معرّفاً. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يُحجب حرف البدل ولا تُطبّق أي مطالبة نظام.
2. **مطالبة نظام بحرف بدل للمجموعة** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائباً تماماً من الخريطة، أو عندما يكون موجوداً لكنه لا يعرّف مفتاح `systemPrompt`.

تدرج الحل للرسائل المباشرة:

تُحدد خريطة `direct` الفعالة أولاً: إذا عرّف الحساب `direct` الخاصة به، فإنها تستبدل بالكامل خريطة `direct` الجذرية (من دون دمج عميق). ثم يجري البحث عن المطالبة على الخريطة الواحدة الناتجة:

1. **مطالبة نظام خاصة بالمباشر** (`direct["<peerId>"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد موجوداً في الخريطة **و** يكون مفتاح `systemPrompt` معرّفاً. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يُحجب حرف البدل ولا تُطبّق أي مطالبة نظام.
2. **مطالبة نظام بحرف بدل للمباشر** (`direct["*"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد غائباً تماماً من الخريطة، أو عندما يكون موجوداً لكنه لا يعرّف مفتاح `systemPrompt`.

<Note>
يبقى `dms` حاوية خفيفة لتجاوز سجل كل DM (`dms.<id>.historyLimit`). تعيش تجاوزات المطالبة ضمن `direct`.
</Note>

**الاختلاف عن سلوك Telegram متعدد الحسابات:** في Telegram، يتم تعطيل `groups` على مستوى الجذر عمدا لكل الحسابات في إعداد متعدد الحسابات، حتى الحسابات التي لا تعرف `groups` خاصة بها، وذلك لمنع الروبوت من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبق WhatsApp هذا الحاجز: يتم دائما توريث `groups` الجذر و`direct` الجذر بواسطة الحسابات التي لا تعرف تجاوزا على مستوى الحساب، بغض النظر عن عدد الحسابات المهيأة. في إعداد WhatsApp متعدد الحسابات، إذا كنت تريد مطالبات مجموعات أو محادثات مباشرة لكل حساب، فعرّف الخريطة الكاملة تحت كل حساب صراحة بدلا من الاعتماد على الإعدادات الافتراضية على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هو في الوقت نفسه خريطة تهيئة لكل مجموعة وقائمة السماح بالمجموعات على مستوى الدردشة. في نطاق الجذر أو الحساب، تعني `groups["*"]` أن "كل المجموعات مقبولة" لذلك النطاق.
- أضف `systemPrompt` لمجموعة بدل عام فقط عندما تريد مسبقا أن يقبل ذلك النطاق كل المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كإعداد افتراضي للمطالبة. بدلا من ذلك، كرر المطالبة في كل إدخال مجموعة مسموح به صراحة.
- قبول المجموعة وتفويض المرسل فحصان منفصلان. توسع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنها لا تفوض بذاتها كل مرسل في تلك المجموعات. لا يزال وصول المرسل مضبوطا بشكل منفصل بواسطة `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` التأثير الجانبي نفسه للرسائل المباشرة. لا يوفر `direct["*"]` إلا تهيئة افتراضية لدردشة مباشرة بعد قبول الرسالة المباشرة مسبقا بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الاقتران.

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
- تعدد الحسابات: `accounts.<id>.enabled`, `accounts.<id>.authDir`, التجاوزات على مستوى الحساب
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
