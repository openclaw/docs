---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه البريد الوارد
summary: دعم قناة WhatsApp وعناصر التحكم في الوصول وسلوك التسليم والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T07:32:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

الحالة: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). يتولى Gateway الجلسة (الجلسات) المرتبطة.

## التثبيت (عند الطلب)

- يطالب كل من `openclaw onboard` و`openclaw channels add --channel whatsapp`
  بتثبيت Plugin الخاص بـ WhatsApp في أول مرة تختاره فيها.
- يوفّر `openclaw channels login --channel whatsapp` أيضًا تدفق التثبيت عندما
  لا يكون Plugin موجودًا بعد.
- قناة التطوير + Git checkout: تستخدم افتراضيًا مسار Plugin المحلي.
- Stable/Beta: تستخدم افتراضيًا حزمة npm ‏`@openclaw/whatsapp`.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة الافتراضية هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    أدوات التشخيص عبر القنوات وخطط الإصلاح.
  </Card>
  <Card title="إعداد Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القنوات الكاملة.
  </Card>
</CardGroup>

## إعداد سريع

<Steps>
  <Step title="إعداد سياسة الوصول إلى WhatsApp">

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

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. الحد الأقصى للطلبات المعلقة هو 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل كلما أمكن. (تم تحسين بيانات القناة الوصفية وتدفق الإعداد لهذا الإعداد، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو وضع التشغيل الأنظف:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - حدود أوضح لقوائم سماح الرسائل الخاصة والتوجيه
    - احتمال أقل لحدوث التباس في المحادثة الذاتية

    نمط سياسة أدنى:

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
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب خط أساس مناسبًا للمحادثة الذاتية:

    - `dmPolicy: "allowlist"`
    - تتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تعتمد وسائل الحماية الخاصة بالمحادثة الذاتية على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة مبنية على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة رسائل WhatsApp منفصلة عبر Twilio ضمن سجل قنوات الدردشة المضمن.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يتولى Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- تتطلب عمليات الإرسال الصادرة مستمع WhatsApp نشطًا للحساب المستهدف.
- يتم تجاهل محادثات الحالة والبث (`@status`, `@broadcast`).
- تستخدم المحادثات المباشرة قواعد جلسة الرسائل الخاصة (`session.dmScope`؛ القيمة الافتراضية `main` تدمج الرسائل الخاصة في الجلسة الرئيسية للوكيل).
- تكون جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يراعي نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway ‏(`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / والمتغيرات المكافئة بحروف صغيرة). فضّل إعداد الوكيل على مستوى المضيف بدلًا من إعدادات وكيل WhatsApp الخاصة بالقناة.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى المحادثات المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    تقبل `allowFrom` أرقامًا بأسلوب E.164 ‏(يتم تطبيعها داخليًا).

    تجاوز متعدد الحسابات: تأخذ `channels.whatsapp.accounts.<id>.dmPolicy` ‏(و`allowFrom`) الأولوية على القيم الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - يتم حفظ الاقترانات في مخزن السماح الخاص بالقناة ودمجها مع `allowFrom` المضبوطة
    - إذا لم يتم ضبط قائمة سماح، فيُسمح بالرقم الذاتي المرتبط افتراضيًا
    - لا يقوم OpenClaw مطلقًا بالاقتران التلقائي لرسائل `fromMe` الخاصة الصادرة (الرسائل التي ترسلها لنفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    يتكون الوصول إلى المجموعات من طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا تم حذف `groups`، تكون كل المجموعات مؤهلة
       - إذا كانت `groups` موجودة، فهي تعمل كقائمة سماح للمجموعات (مع السماح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتم تجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` ‏(أو `*`)
       - `disabled`: حظر كل الرسائل الواردة من المجموعات

    الرجوع لقائمة سماح المرسل:

    - إذا لم يتم ضبط `groupAllowFrom`، يرجع وقت التشغيل إلى `allowFrom` عند توفرها
    - يتم تقييم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` إطلاقًا، فإن الرجوع في سياسة المجموعات أثناء وقت التشغيل يكون إلى `allowlist` ‏(مع سجل تحذير)، حتى إذا تم ضبط `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب ردود المجموعات الإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة ما يلي:

    - إشارات WhatsApp الصريحة لهوية البوت
    - أنماط regex للإشارة المضبوطة (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`)
    - اكتشاف الرد الضمني على البوت (مرسل الرد يطابق هوية البوت)

    ملاحظة أمنية:

    - يحقق الاقتباس/الرد فقط شرط بوابة الإشارة؛ لكنه **لا** يمنح تفويضًا للمرسل
    - مع `groupPolicy: "allowlist"`، لا يزال المرسلون غير المدرجين في قائمة السماح محظورين حتى إذا ردوا على رسالة من مستخدم مدرج في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يقوم `activation` بتحديث حالة الجلسة (وليس الإعداد العام). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والمحادثة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، يتم تفعيل وسائل الحماية الخاصة بالمحادثة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لأدوار المحادثة الذاتية
- تجاهل سلوك التفعيل التلقائي لـ mention-JID الذي كان سيؤدي بخلاف ذلك إلى تنبيه نفسك
- إذا لم يتم ضبط `messages.responsePrefix`، فإن ردود المحادثة الذاتية تستخدم افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="الغلاف الوارد + سياق الرد">
    تُغلّف رسائل WhatsApp الواردة ضمن الغلاف الوارد المشترك.

    إذا وُجد رد مقتبس، يُلحَق السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    يتم أيضًا تعبئة حقول البيانات الوصفية للرد عند توفرها (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="عناصر نائبة للوسائط واستخراج الموقع/جهة الاتصال">
    يتم تطبيع الرسائل الواردة التي تحتوي على وسائط فقط بعناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تستخدم أجسام المواقع نصًا موجزًا للإحداثيات. وتُعرض تسميات/تعليقات المواقع وتفاصيل جهات الاتصال/vCard كبيانات وصفية غير موثوقة ضمن مقاطع مسيجة، وليس كنص مضمّن في الموجّه.

  </Accordion>

  <Accordion title="حقن سجل المجموعة المعلّق">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يتم تشغيل البوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الرجوع إلى: `messages.groupChat.historyLimit`
    - `0` للتعطيل

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

    تتخطى أدوار المحادثة الذاتية إيصالات القراءة حتى عند تفعيلها عالميًا.

  </Accordion>
</AccordionGroup>

## التسليم والتقسيم والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص">
    - الحد الافتراضي للتقسيم: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يرجع إلى التقسيم الآمن بحسب الطول
  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - تتم إعادة كتابة `audio/ogg` إلى `audio/ogg; codecs=opus` للتوافق مع الملاحظات الصوتية
    - يتم دعم تشغيل GIF المتحرك عبر `gifPlayback: true` عند إرسال الفيديو
    - يتم تطبيق التعليقات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط
    - يمكن أن يكون مصدر الوسائط HTTP(S) أو `file://` أو مسارات محلية
  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الرجوع">
    - حد حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` ‏(الافتراضي `50`)
    - حد إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` ‏(الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - يتم تحسين الصور تلقائيًا (تغيير الحجم/اختبار الجودة) لتلائم الحدود
    - عند فشل إرسال الوسائط، يرسل الرجوع الخاص بالعنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت
  </Accordion>
</AccordionGroup>

## اقتباس الرد

يدعم WhatsApp اقتباس الرد الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم فيه باستخدام `channels.whatsapp.replyToMode`.

| القيمة   | السلوك                                                                 |
| -------- | ---------------------------------------------------------------------- |
| `"auto"` | اقتبس الرسالة الواردة عندما يدعم الموفر ذلك؛ وتجاوز الاقتباس خلاف ذلك |
| `"on"`   | اقتبس الرسالة الواردة دائمًا؛ وارجع إلى إرسال عادي إذا تم رفض الاقتباس |
| `"off"`  | لا تقتبس مطلقًا؛ أرسل كرسالة عادية                                    |

القيمة الافتراضية هي `"auto"`. تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## مستوى التفاعلات

يتحكم `channels.whatsapp.reactionLevel` في مدى اتساع استخدام الوكيل لتفاعلات الرموز التعبيرية على WhatsApp:

| المستوى      | تفاعلات الإقرار | التفاعلات التي يبدأها الوكيل | الوصف                                        |
| ------------ | --------------- | ---------------------------- | -------------------------------------------- |
| `"off"`      | لا              | لا                           | لا توجد أي تفاعلات                           |
| `"ack"`      | نعم             | لا                           | تفاعلات الإقرار فقط (إيصال ما قبل الرد)      |
| `"minimal"`  | نعم             | نعم (متحفظة)                 | إقرار + تفاعلات وكيل مع إرشاد متحفظ         |
| `"extensive"`| نعم             | نعم (مشجعة)                  | إقرار + تفاعلات وكيل مع إرشاد مشجع          |

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
تُقيَّد تفاعلات الإقرار بواسطة `reactionLevel` — ويتم كبتها عندما تكون `reactionLevel` هي `"off"`.

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

- تُرسل فور قبول الرسالة الواردة (قبل الرد)
- يتم تسجيل الإخفاقات في السجلات لكنها لا تمنع تسليم الرد العادي
- يضع وضع المجموعة `mentions` تفاعلًا على الأدوار التي تم تشغيلها بالإشارة؛ ويعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp ‏`channels.whatsapp.ackReaction` ‏(ولا يُستخدم هنا `messages.ackReaction` القديم)

## تعدد الحسابات وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والقيم الافتراضية">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودًا، وإلا فأول معرّف حساب مضبوط (بعد الفرز)
    - يتم تطبيع معرّفات الحسابات داخليًا لأغراض البحث
  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق مع الإصدارات القديمة">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا يزال يتم التعرف على المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` وترحيلها لتدفقات الحساب الافتراضي
  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يقوم `openclaw channels logout --channel whatsapp [--account <id>]` بمسح حالة مصادقة WhatsApp لذلك الحساب.

    في أدلة المصادقة القديمة، يتم الاحتفاظ بـ `oauth.json` بينما تتم إزالة ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات الإعدادات

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp ‏(`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تكون كتابات الإعدادات التي تبدأ من القناة مفعلة افتراضيًا (يمكن تعطيلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (مطلوب QR)">
    العرض: تشير حالة القناة إلى أنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكن مفصول / حلقة إعادة اتصال">
    العرض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

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

  <Accordion title="يتم تجاهل رسائل المجموعة بشكل غير متوقع">
    تحقّق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارة (`requireMention` + أنماط الإشارة)
    - مفاتيح مكررة في `openclaw.json` ‏(JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذا احتفظ بقيمة `groupPolicy` واحدة فقط لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل WhatsApp gateway ‏Node. يتم تمييز Bun على أنه غير متوافق مع التشغيل المستقر لـ WhatsApp/Telegram gateway.
  </Accordion>
</AccordionGroup>

## موجّهات النظام

يدعم WhatsApp موجّهات النظام بأسلوب Telegram للمجموعات والمحادثات المباشرة عبر خريطتَي `groups` و`direct`.

التسلسل الهرمي للحل لرسائل المجموعات:

يتم تحديد خريطة `groups` الفعلية أولًا: إذا كان الحساب يعرّف `groups` الخاصة به، فإنها تستبدل خريطة `groups` الجذرية بالكامل (من دون دمج عميق). ثم يتم تشغيل البحث عن الموجّه على الخريطة المفردة الناتجة:

1. **موجّه نظام خاص بالمجموعة** (`groups["<groupId>"].systemPrompt`): يُستخدم إذا كان إدخال المجموعة المحدد يعرّف `systemPrompt`.
2. **موجّه نظام بدل شامل للمجموعة** (`groups["*"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحدد غائبًا أو لا يعرّف `systemPrompt`.

التسلسل الهرمي للحل للرسائل المباشرة:

يتم تحديد خريطة `direct` الفعلية أولًا: إذا كان الحساب يعرّف `direct` الخاصة به، فإنها تستبدل خريطة `direct` الجذرية بالكامل (من دون دمج عميق). ثم يتم تشغيل البحث عن الموجّه على الخريطة المفردة الناتجة:

1. **موجّه نظام خاص بالمحادثة المباشرة** (`direct["<peerId>"].systemPrompt`): يُستخدم إذا كان إدخال النظير المحدد يعرّف `systemPrompt`.
2. **موجّه نظام بدل شامل للمحادثة المباشرة** (`direct["*"].systemPrompt`): يُستخدم عندما يكون إدخال النظير المحدد غائبًا أو لا يعرّف `systemPrompt`.

ملاحظة: تظل `dms` حاوية خفيفة لتجاوزات السجل لكل رسالة خاصة (`dms.<id>.historyLimit`)؛ أما تجاوزات الموجّهات فتوجد تحت `direct`.

**الاختلاف عن سلوك Telegram متعدد الحسابات:** في Telegram، يتم عمدًا كبت `groups` الجذرية لجميع الحسابات في إعداد متعدد الحسابات — حتى الحسابات التي لا تعرّف `groups` خاصة بها — لمنع البوت من استلام رسائل المجموعات التي لا ينتمي إليها. لا يطبق WhatsApp هذا القيد: إذ ترث الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب كلًا من `groups` الجذرية و`direct` الجذرية دائمًا، بغض النظر عن عدد الحسابات المضبوطة. في إعداد WhatsApp متعدد الحسابات، إذا كنت تريد موجّهات مجموعات أو محادثات مباشرة لكل حساب، فعرّف الخريطة الكاملة تحت كل حساب صراحةً بدلًا من الاعتماد على القيم الافتراضية على مستوى الجذر.

سلوك مهم:

- تُعد `channels.whatsapp.groups` خريطة إعداد لكل مجموعة وقائمة السماح على مستوى الدردشة للمجموعات في الوقت نفسه. وعلى مستوى الجذر أو الحساب، تعني `groups["*"]` أن "جميع المجموعات مقبولة" لذلك النطاق.
- أضف `systemPrompt` شاملًا للمجموعة فقط عندما تريد فعلًا أن يقبل ذلك النطاق جميع المجموعات. وإذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كقيمة افتراضية للموجّه. وبدلًا من ذلك، كرر الموجّه في كل إدخال مجموعة مدرج صراحةً في قائمة السماح.
- قبول المجموعة وتفويض المرسل عمليتا فحص منفصلتان. توسّع `groups["*"]` مجموعة المجموعات التي يمكن أن تصل إلى معالجة المجموعات، لكنها لا تفوض بذاتها كل مرسل في تلك المجموعات. يظل وصول المرسل خاضعًا للتحكم بشكل منفصل عبر `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا تمتلك `channels.whatsapp.direct` الأثر الجانبي نفسه للرسائل الخاصة. يوفّر `direct["*"]` فقط إعدادًا افتراضيًا للمحادثة المباشرة بعد أن تكون الرسالة الخاصة قد قُبلت بالفعل بواسطة `dmPolicy` بالإضافة إلى `allowFrom` أو قواعد مخزن الاقتران.

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
- العمليات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- سلوك الجلسة: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- الموجّهات: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
