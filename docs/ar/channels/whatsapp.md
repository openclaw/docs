---
read_when:
    - العمل على سلوك قناة WhatsApp/web أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وعناصر التحكم في الوصول، وسلوك التسليم، والعمليات التشغيلية
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T18:18:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0935e7ac3676c57d83173a6dd9eedc489f77b278dfbc47bd811045078ee7e4d0
    source_path: channels/whatsapp.md
    workflow: 15
---

الحالة: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). يتولى Gateway إدارة الجلسة/الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يعمل الإعداد الأولي (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  على المطالبة بتثبيت إضافة WhatsApp في أول مرة تحددها فيها.
- يوفّر `openclaw channels login --channel whatsapp` أيضًا تدفق التثبيت عندما
  لا تكون الإضافة موجودة بعد.
- قناة التطوير + سحب git: يكون الإعداد الافتراضي هو مسار الإضافة المحلي.
- Stable/Beta: يكون الإعداد الافتراضي هو حزمة npm ‏`@openclaw/whatsapp`.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    السياسة الافتراضية للرسائل المباشرة من المرسلين غير المعروفين هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة الإصلاح.
  </Card>
  <Card title="إعداد Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القناة الكاملة.
  </Card>
</CardGroup>

## إعداد سريع

<Steps>
  <Step title="تكوين سياسة الوصول إلى WhatsApp">

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

  <Step title="تشغيل Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="الموافقة على أول طلب اقتران (إذا كنت تستخدم وضع الاقتران)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. ويُحدَّد الحد الأقصى للطلبات المعلّقة بـ 3 لكل قناة.

  </Step>
</Steps>

<Note>
توصي OpenClaw بتشغيل WhatsApp على رقم منفصل عندما يكون ذلك ممكنًا. (تجري تهيئة بيانات القناة الوصفية وتدفق الإعداد لهذا الإعداد، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو نمط التشغيل الأكثر وضوحًا:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح أوضح للرسائل المباشرة وحدود توجيه أوضح
    - احتمال أقل لحدوث التباس بسبب الدردشة الذاتية

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

  <Accordion title="الرجوع إلى الرقم الشخصي">
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب إعدادًا أساسيًا مناسبًا للدردشة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تعتمد وسائل الحماية الخاصة بالدردشة الذاتية على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة تعتمد على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة WhatsApp منفصلة عبر Twilio في سجل قنوات الدردشة المضمّن.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يتولى Gateway إدارة مقبس WhatsApp وحلقة إعادة الاتصال.
- تتطلب عمليات الإرسال الصادرة وجود مستمع WhatsApp نشط للحساب المستهدف.
- يتم تجاهل محادثات الحالة والبث (`@status`, `@broadcast`).
- تستخدم المحادثات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ القيمة الافتراضية `main` تدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل).
- تكون جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يلتزم نقل WhatsApp Web بمتغيرات بيئة الوكيل القياسية على مضيف Gateway ‏(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / والنظائر بالأحرف الصغيرة). يُفضَّل إعداد الوكيل على مستوى المضيف بدلًا من إعدادات وكيل WhatsApp الخاصة بالقناة.

## Hooks الإضافة والخصوصية

قد تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية وأرقام هواتف
ومعرّفات مجموعات وأسماء مرسلين وحقول ربط الجلسات. لهذا السبب،
لا يبث WhatsApp حمولات hook ‏`message_received` الواردة إلى Plugins
ما لم تقم بتمكين ذلك صراحةً:

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

يمكنك حصر التمكين لحساب واحد:

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

فعّل هذا فقط للإضافات التي تثق بها لتلقّي محتوى رسائل WhatsApp
الواردة والمُعرّفات.

## التحكم في الوصول والتنشيط

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى المحادثات المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقامًا بنمط E.164 (تُطبَّع داخليًا).

    تجاوز متعدد الحسابات: تكون الأولوية لـ `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) على القيم الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفَظ عمليات الاقتران في مخزن السماح الخاص بالقناة وتُدمَج مع `allowFrom` المكوَّن
    - إذا لم تُضبط أي قائمة سماح، فسيُسمح بالرقم الذاتي المرتبط افتراضيًا
    - لا يقوم OpenClaw أبدًا بإقران رسائل `fromMe` المباشرة الصادرة تلقائيًا (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    يمتلك الوصول إلى المجموعات طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا حُذف `groups`، تكون كل المجموعات مؤهلة
       - إذا وُجد `groups`، فإنه يعمل كقائمة سماح للمجموعات (يسمح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتم تجاوز قائمة سماح المرسل
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الرسائل الواردة من المجموعات

    الرجوع إلى قائمة سماح المرسل:

    - إذا لم يُضبط `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفره
    - تُقيَّم قوائم سماح المرسلين قبل تنشيط الإشارة/الرد

    ملاحظة: إذا لم يكن هناك أي كتلة `channels.whatsapp` على الإطلاق، فإن الرجوع إلى سياسة المجموعات في وقت التشغيل يكون `allowlist` (مع سجل تحذير)، حتى لو كان `channels.defaults.groupPolicy` مضبوطًا.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب الردود في المجموعات الإشارة افتراضيًا.

    يتضمن كشف الإشارة ما يلي:

    - إشارات WhatsApp صريحة إلى هوية الروبوت
    - أنماط regex للإشارة المضبوطة (`agents.list[].groupChat.mentionPatterns`، والرجوع إلى `messages.groupChat.mentionPatterns`)
    - كشف ضمني للرد على الروبوت (مطابقة مرسل الرد لهوية الروبوت)

    ملاحظة أمنية:

    - الاقتباس/الرد يفي فقط ببوابة الإشارة؛ لكنه **لا** يمنح تفويضًا للمرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير الموجودين في قائمة السماح محظورين حتى لو ردوا على رسالة من مستخدم موجود في قائمة السماح

    أمر التنشيط على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يقوم `activation` بتحديث حالة الجلسة (وليس الإعداد العام). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والدردشة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، تُفعَّل وسائل الحماية الخاصة بالدردشة الذاتية في WhatsApp:

- تخطي إيصالات القراءة في أدوار الدردشة الذاتية
- تجاهل سلوك التشغيل التلقائي لـ mention-JID الذي قد يؤدي بخلاف ذلك إلى تنبيه نفسك
- إذا كان `messages.responsePrefix` غير مضبوط، فإن ردود الدردشة الذاتية تستخدم افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="الغلاف الوارد + سياق الرد">
    تُغلَّف رسائل WhatsApp الواردة داخل الغلاف الوارد المشترك.

    إذا وُجد رد مقتبس، يُلحَق السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُملأ أيضًا حقول بيانات تعريف الرد عند توفرها (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, وJID/E.164 الخاص بالمرسل).

  </Accordion>

  <Accordion title="عناصر media النائبة واستخراج الموقع/جهة الاتصال">
    تُطبَّع رسائل media الواردة التي لا تحتوي إلا على media باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تستخدم نصوص المواقع إحداثيات موجزة. وتُعرَض تسميات/تعليقات المواقع وتفاصيل جهات الاتصال/vCard كبيانات تعريف غير موثوقة ضمن كتل مسوّرة، وليس كنص مضمّن داخل الـ prompt.

  </Accordion>

  <Accordion title="إدخال سجل المجموعات المعلّق">
    بالنسبة للمجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يتم تشغيل الروبوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الرجوع: `messages.groupChat.historyLimit`
    - القيمة `0` تعطل الميزة

    علامات الإدخال:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="إيصالات القراءة">
    تكون إيصالات القراءة مفعّلة افتراضيًا لرسائل WhatsApp الواردة المقبولة.

    للتعطيل على مستوى عام:

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

    تتخطى أدوار الدردشة الذاتية إيصالات القراءة حتى عندما تكون مفعّلة على مستوى عام.

  </Accordion>
</AccordionGroup>

## التسليم والتقسيم وmedia

<AccordionGroup>
  <Accordion title="تقسيم النص">
    - حد التقسيم الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التقسيم الآمن بحسب الطول
  </Accordion>

  <Accordion title="سلوك media الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - تحافظ حمولات الرد على `audioAsVoice`؛ ويرسل WhatsApp media الصوتية كملاحظات صوتية PTT عبر Baileys
    - يُحوَّل الصوت غير Ogg، بما في ذلك خرج Microsoft Edge TTS بتنسيق MP3/WebM، إلى Ogg/Opus قبل تسليم PTT
    - يُرسَل صوت Ogg/Opus الأصلي باستخدام `audio/ogg; codecs=opus` لتحقيق توافق الملاحظات الصوتية
    - يُدعَم تشغيل صور GIF المتحركة عبر `gifPlayback: true` عند إرسال الفيديو
    - تُطبَّق التسميات التوضيحية على أول عنصر media عند إرسال حمولات رد متعددة media، باستثناء أن ملاحظات PTT الصوتية ترسل الصوت أولًا والنص المرئي بشكل منفصل لأن عملاء WhatsApp لا يعرضون تسميات الملاحظات الصوتية التوضيحية بشكل متسق
    - يمكن أن يكون مصدر media هو HTTP(S) أو `file://` أو مسارات محلية
  </Accordion>

  <Accordion title="حدود حجم media وسلوك الرجوع">
    - الحد الأقصى لحفظ media الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - الحد الأقصى لإرسال media الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسَّن الصور تلقائيًا (إعادة تحجيم/تمرير الجودة) لتلائم الحدود
    - عند فشل إرسال media، يرسل الرجوع للعنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت
  </Accordion>
</AccordionGroup>

## اقتباس الرد

يدعم WhatsApp اقتباس الرد الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. يمكنك التحكم في ذلك باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                              |
| ------------ | ------------------------------------------------------------------- |
| `"off"`      | عدم الاقتباس مطلقًا؛ الإرسال كرسالة عادية                           |
| `"first"`    | اقتباس أول جزء فقط من أجزاء الرد الصادر                             |
| `"all"`      | اقتباس كل جزء من أجزاء الرد الصادر                                  |
| `"batched"`  | اقتباس الردود المجمّعة الموجودة في قائمة الانتظار مع ترك الردود الفورية دون اقتباس |

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

## مستوى التفاعل

يتحكم `channels.whatsapp.reactionLevel` في مدى استخدام الوكيل لتفاعلات emoji على WhatsApp:

| المستوى       | تفاعلات التأكيد | تفاعلات يبدأها الوكيل | الوصف                                             |
| ------------- | --------------- | --------------------- | ------------------------------------------------- |
| `"off"`       | لا              | لا                    | لا توجد أي تفاعلات مطلقًا                         |
| `"ack"`       | نعم             | لا                    | تفاعلات تأكيد فقط (استلام قبل الرد)               |
| `"minimal"`   | نعم             | نعم (بحذر)            | تأكيد + تفاعلات وكيل بإرشادات متحفظة              |
| `"extensive"` | نعم             | نعم (مُشجَّعة)        | تأكيد + تفاعلات وكيل بإرشادات مُشجَّعة            |

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

## تفاعلات التأكيد

يدعم WhatsApp تفاعلات التأكيد الفورية عند استلام الرسالة الواردة عبر `channels.whatsapp.ackReaction`.
تخضع تفاعلات التأكيد إلى `reactionLevel` — ويتم تعطيلها عندما تكون قيمة `reactionLevel` هي `"off"`.

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
- في وضع المجموعة `mentions`، يتم التفاعل في الأدوار التي تُحفَّز بالإشارة؛ ويعمل تنشيط المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp القيمة `channels.whatsapp.ackReaction` (ولا تُستخدم هنا القيمة القديمة `messages.ackReaction`)

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="تحديد الحساب والقيم الافتراضية">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - تحديد الحساب الافتراضي: `default` إذا كان موجودًا، وإلا فمعرّف أول حساب مُعدّ (بعد الفرز)
    - تُطبَّع معرّفات الحسابات داخليًا لأغراض البحث
  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق مع الإصدارات القديمة">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - الملف الاحتياطي: `creds.json.bak`
    - لا يزال التعرف على المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` قائمًا/ويتم ترحيلها في تدفقات الحساب الافتراضي
  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يعمل `openclaw channels logout --channel whatsapp [--account <id>]` على مسح حالة مصادقة WhatsApp لذلك الحساب.

    في أدلة المصادقة القديمة، يتم الاحتفاظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وعمليات كتابة الإعداد

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp ‏(`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تكون عمليات كتابة الإعداد التي تبدأها القناة مفعّلة افتراضيًا (يمكن تعطيلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (QR مطلوب)">
    العرض: تشير حالة القناة إلى أنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكن غير متصل / حلقة إعادة اتصال">
    العرض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال متكررة.

    الإصلاح:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    عند الحاجة، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل عمليات الإرسال الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب المستهدف.

    تأكد من أن Gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات بشكل غير متوقع">
    تحقّق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة سماح `groups`
    - بوابة الإشارة (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` ‏(JSON5): الإدخالات اللاحقة تتجاوز السابقة، لذا احتفظ بقيمة `groupPolicy` واحدة فقط لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل Gateway الخاص بـ WhatsApp بيئة Node. يتم الإبلاغ عن Bun على أنه غير متوافق مع تشغيل Gateway المستقر لـ WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات نظام بأسلوب Telegram للمجموعات والمحادثات المباشرة عبر خرائط `groups` و`direct`.

التسلسل الهرمي لحل القيم لرسائل المجموعات:

يتم أولًا تحديد خريطة `groups` الفعالة: إذا كان الحساب يعرّف `groups` خاصة به، فإنها تستبدل بالكامل خريطة `groups` الجذرية (من دون دمج عميق). بعد ذلك يتم تنفيذ البحث عن الـ prompt على الخريطة المفردة الناتجة:

1. **مطالبة نظام خاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة موجودًا في الخريطة **ويكون** المفتاح `systemPrompt` معرّفًا فيها. إذا كانت قيمة `systemPrompt` سلسلة فارغة (`""`)، يتم تعطيل wildcard ولا تُطبَّق أي مطالبة نظام.
2. **مطالبة نظام wildcard للمجموعة** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف المفتاح `systemPrompt`.

التسلسل الهرمي لحل القيم للرسائل المباشرة:

يتم أولًا تحديد خريطة `direct` الفعالة: إذا كان الحساب يعرّف `direct` خاصة به، فإنها تستبدل بالكامل خريطة `direct` الجذرية (من دون دمج عميق). بعد ذلك يتم تنفيذ البحث عن الـ prompt على الخريطة المفردة الناتجة:

1. **مطالبة نظام خاصة بالمحادثة المباشرة** (`direct["<peerId>"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد موجودًا في الخريطة **ويكون** المفتاح `systemPrompt` معرّفًا فيها. إذا كانت قيمة `systemPrompt` سلسلة فارغة (`""`)، يتم تعطيل wildcard ولا تُطبَّق أي مطالبة نظام.
2. **مطالبة نظام wildcard للمحادثة المباشرة** (`direct["*"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف المفتاح `systemPrompt`.

ملاحظة: يظل `dms` هو حاوية التجاوزات الخفيفة لسجل كل رسالة مباشرة (`dms.<id>.historyLimit`)؛ وتوجد تجاوزات الـ prompt تحت `direct`.

**الاختلاف عن سلوك Telegram متعدد الحسابات:** في Telegram، يتم تعطيل `groups` الجذرية عمدًا لجميع الحسابات في إعداد متعدد الحسابات — حتى الحسابات التي لا تعرّف `groups` خاصة بها — لمنع الروبوت من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبق WhatsApp هذا القيد: إذ تُورَّث `groups` الجذرية و`direct` الجذرية دائمًا إلى الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بصرف النظر عن عدد الحسابات المضبوطة. في إعداد WhatsApp متعدد الحسابات، إذا كنت تريد prompts خاصة بكل حساب للمجموعات أو المحادثات المباشرة، فعرّف الخريطة الكاملة تحت كل حساب صراحةً بدلًا من الاعتماد على القيم الافتراضية على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هي في الوقت نفسه خريطة إعداد لكل مجموعة وقائمة سماح للمجموعات على مستوى الدردشة. على مستوى الجذر أو الحساب، تعني `groups["*"]` أن "جميع المجموعات مسموح بها" لذلك النطاق.
- أضف wildcard group `systemPrompt` فقط عندما تريد أصلًا أن يسمح ذلك النطاق بجميع المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كقيمة افتراضية للـ prompt. بدلًا من ذلك، كرر الـ prompt في كل إدخال مجموعة مضاف صراحةً إلى قائمة السماح.
- قبول المجموعة وتخويل المرسل هما فحصان منفصلان. توسّع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنها لا تخوّل بمفردها كل مرسل في تلك المجموعات. يظل الوصول الخاص بالمرسل خاضعًا بشكل منفصل إلى `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` التأثير الجانبي نفسه على الرسائل المباشرة. إذ يوفّر `direct["*"]` فقط إعدادًا افتراضيًا للمحادثة المباشرة بعد قبول الرسالة المباشرة بالفعل بواسطة `dmPolicy` بالإضافة إلى قواعد `allowFrom` أو مخزن الاقتران.

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

## مؤشرات مرجعية للإعداد

المرجع الأساسي:

- [مرجع الإعداد - WhatsApp](/ar/gateway/config-channels#whatsapp)

حقول WhatsApp عالية الأهمية:

- الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- الحسابات المتعددة: `accounts.<id>.enabled`, `accounts.<id>.authDir`, والتجاوزات على مستوى الحساب
- العمليات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- سلوك الجلسة: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- الـ prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القناة](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
