---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:16:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: جاهز للإنتاج عبر WhatsApp Web (Baileys). يمتلك Gateway الجلسة/الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يطالبك الإعداد الأولي (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  بتثبيت Plugin WhatsApp في أول مرة تحدده فيها.
- يوفّر `openclaw channels login --channel whatsapp` أيضًا مسار التثبيت عندما
  لا يكون Plugin موجودًا بعد.
- قناة التطوير + نسخة git: تستخدم مسار Plugin المحلي افتراضيًا.
- Stable/Beta: يثبتان Plugin `@openclaw/whatsapp` الرسمي من ClawHub
  أولًا، مع npm كخيار احتياطي.
- يُوزَّع وقت تشغيل WhatsApp خارج حزمة OpenClaw npm الأساسية حتى
  تبقى تبعيات وقت التشغيل الخاصة بـ WhatsApp مع Plugin الخارجي.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

استخدم حزمة npm المجردة (`@openclaw/whatsapp`) فقط عندما تحتاج إلى خيار السجل
الاحتياطي. ثبّت إصدارًا محددًا بدقة فقط عندما تحتاج إلى تثبيت قابل للتكرار.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الإقران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وخطط إصلاح.
  </Card>
  <Card title="تكوين Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة تكوين القنوات كاملة.
  </Card>
</CardGroup>

## الإعداد السريع

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

  <Step title="ربط WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    تسجيل الدخول الحالي يعتمد على QR. في البيئات البعيدة أو بلا واجهة، تأكد من
    وجود مسار موثوق لتسليم رمز QR الحي إلى الهاتف الذي سيمسحه قبل بدء
    تسجيل الدخول.

    لحساب محدد:

```bash
openclaw channels login --channel whatsapp --account work
```

    لإرفاق مجلد مصادقة WhatsApp Web موجود/مخصص قبل تسجيل الدخول:

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

  <Step title="الموافقة على أول طلب إقران (إذا كنت تستخدم وضع الإقران)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الإقران بعد ساعة واحدة. تُحدَّد الطلبات المعلّقة بـ 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل عندما يكون ذلك ممكنًا. (تم تحسين بيانات تعريف القناة ومسار الإعداد لذلك النمط، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

<Warning>
مسار إعداد WhatsApp الحالي يدعم QR فقط. قد تنتهي صلاحية رموز QR المعروضة في الطرفية أو لقطات الشاشة
أو ملفات PDF أو مرفقات الدردشة أو تصبح غير قابلة للقراءة أثناء تمريرها
من جهاز بعيد. بالنسبة للمضيفين البعيدين/بلا واجهة، فضّل مسار تسليم مباشر لصورة QR
على الالتقاط اليدوي من الطرفية.
</Warning>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو أنظف وضع تشغيلي:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح أوضح للرسائل المباشرة وحدود توجيه أوضح
    - احتمال أقل للالتباس بسبب الدردشة الذاتية

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

  <Accordion title="خيار الرقم الشخصي الاحتياطي">
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب خط أساس مناسبًا للدردشة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تعتمد حماية الدردشة الذاتية على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة مبنية على WhatsApp Web (`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة Twilio WhatsApp منفصلة في سجل قنوات الدردشة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يمتلك Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- يستخدم مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس فقط حجم رسائل التطبيق الواردة، لذلك لا تُعاد جلسة جهاز مرتبط هادئة لمجرد أن أحدًا لم يرسل رسالة مؤخرًا. ما زال حد صمت التطبيق الأطول يفرض إعادة اتصال إذا استمرت إطارات النقل في الوصول لكن لم تُعالَج أي رسائل تطبيق خلال نافذة المراقبة؛ وبعد إعادة اتصال عابرة لجلسة نشطة مؤخرًا، يستخدم فحص صمت التطبيق ذاك مهلة الرسائل العادية لأول نافذة استرداد.
- توقيتات مقبس Baileys صريحة ضمن `web.whatsapp.*`: يتحكم `keepAliveIntervalMs` في نبضات تطبيق WhatsApp Web، ويتحكم `connectTimeoutMs` في مهلة مصافحة الفتح، ويتحكم `defaultQueryTimeoutMs` في انتظار استعلامات Baileys بالإضافة إلى حدود عمليات الإرسال/الحضور الصادرة المحلية في OpenClaw وإيصالات القراءة الواردة.
- تتطلب الإرسالات الصادرة مستمع WhatsApp نشطًا للحساب المستهدف.
- تُرفق إرسالات المجموعات بيانات تعريف الإشارة الأصلية لرموز `@+<digits>` و`@<digits>` في النصوص وتعليقات الوسائط عندما يطابق الرمز بيانات تعريف مشارك WhatsApp الحالية، بما في ذلك المجموعات المدعومة بـ LID.
- يتم تجاهل محادثات الحالة والبث (`@status`، `@broadcast`).
- يتبع مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس فقط حجم رسائل التطبيق الواردة: تبقى جلسات الأجهزة المرتبطة الهادئة قائمة ما دامت إطارات النقل مستمرة، لكن توقف النقل يفرض إعادة الاتصال قبل وقت طويل من مسار انقطاع الاتصال البعيد اللاحق.
- تستخدم المحادثات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ القيمة الافتراضية `main` تدمج الرسائل المباشرة في جلسة الوكيل الرئيسية).
- جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يمكن أن تكون قنوات/نشرات WhatsApp أهدافًا صادرة صريحة باستخدام JID الأصلي `@newsletter`. تستخدم إرسالات النشرات الصادرة بيانات تعريف جلسة القناة (`agent:<agentId>:whatsapp:channel:<jid>`) بدلًا من دلالات جلسة الرسائل المباشرة.
- يحترم نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY`، `HTTP_PROXY`، `NO_PROXY` / المتغيرات بالأحرف الصغيرة). فضّل تكوين الوكيل على مستوى المضيف على إعدادات وكيل WhatsApp الخاصة بالقناة.
- عند تمكين `messages.removeAckAfterReply`، يمسح OpenClaw تفاعل تأكيد WhatsApp بعد تسليم رد مرئي.

## مطالبات الموافقة

يمكن لـ WhatsApp عرض مطالبات موافقة exec وPlugin باستخدام تفاعلات `👍` / `👎`. يتم التحكم في التسليم
من خلال تكوين تمرير الموافقات في المستوى الأعلى:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` و`approvals.plugin` مستقلان. يؤدي تمكين WhatsApp كقناة إلى ربط
النقل فقط؛ ولا يرسل مطالبات موافقة ما لم تكن عائلة الموافقة المطابقة ممكّنة
وموجَّهة إلى WhatsApp. يسلّم وضع الجلسة موافقات الرموز التعبيرية الأصلية فقط للموافقات التي
تنشأ من WhatsApp. يستخدم وضع الهدف مسار التمرير المشترك لأهداف WhatsApp
الصريحة ولا ينشئ انتشارًا منفصلًا لرسائل مباشرة إلى الموافقين.

تتطلب تفاعلات موافقة WhatsApp موافقين صريحين في WhatsApp من `allowFrom` أو `"*"`.
يتحكم `defaultTo` في أهداف الرسائل الافتراضية العادية؛ وليس موافقًا للموافقة. ما زالت أوامر
`/approve` اليدوية تمر عبر مسار تفويض مرسل WhatsApp العادي قبل
حل الموافقة.

## خطافات Plugin والخصوصية

يمكن أن تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية وأرقام هواتف
ومعرّفات مجموعات وأسماء مرسلين وحقول ارتباط الجلسة. ولهذا السبب،
لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى Plugins
ما لم تشترك صراحةً:

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

فعّل هذا فقط لـ Plugins التي تثق بها لاستلام محتوى رسائل WhatsApp الواردة
والمعرّفات.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى الدردشة المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقامًا بنمط E.164 (تُطبَّع داخليًا).

    `allowFrom` هي قائمة تحكم في وصول مرسلي الرسائل المباشرة. ولا تتحكم في الإرسالات الصادرة الصريحة إلى JIDs مجموعات WhatsApp أو JIDs قنوات `@newsletter`.

    تجاوز الحسابات المتعددة: تكون لـ `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) الأسبقية على الإعدادات الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفَظ عمليات الإقران في مخزن سماح القناة وتُدمج مع `allowFrom` المكوّن
    - تستخدم الأتمتة المجدولة وخيار مستلم Heartbeat الاحتياطي أهداف تسليم صريحة أو `allowFrom` المكوّن؛ موافقات إقران الرسائل المباشرة ليست مستلمي Cron أو Heartbeat ضمنيين
    - إذا لم تُكوَّن قائمة سماح، يُسمح بالرقم الذاتي المرتبط افتراضيًا
    - لا يقرن OpenClaw تلقائيًا رسائل `fromMe` المباشرة الصادرة (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    يحتوي وصول المجموعات على طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا حُذف `groups`، تكون كل المجموعات مؤهلة
       - إذا وُجد `groups`، يعمل كقائمة سماح للمجموعات (`"*"` مسموح)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: تجاوز قائمة سماح المرسل
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الوارد من المجموعات

    خيار قائمة سماح المرسل الاحتياطي:

    - إذا لم يتم تعيين `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفره
    - تُقيَّم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` إطلاقًا، فإن خيار سياسة المجموعات الاحتياطي في وقت التشغيل هو `allowlist` (مع سجل تحذير)، حتى إذا تم تعيين `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب ردود المجموعات الإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة:

    - إشارات WhatsApp صريحة إلى هوية الروبوت
    - أنماط regex للإشارة المكوّنة (`agents.list[].groupChat.mentionPatterns`، والخيار الاحتياطي `messages.groupChat.mentionPatterns`)
    - نصوص الملاحظات الصوتية الواردة لرسائل المجموعات المصرح بها
    - اكتشاف الرد الضمني على الروبوت (يطابق مرسل الرد هوية الروبوت)

    ملاحظة أمنية:

    - الاقتباس/الرد يفي فقط بشرط الإشارة؛ ولا يمنح تفويض المرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير الموجودين في قائمة السماح محظورين حتى إذا ردوا على رسالة مستخدم موجود في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس التكوين العام). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## ارتباطات ACP المكوّنة

يدعم WhatsApp ارتباطات ACP دائمة باستخدام إدخالات `bindings[]` في المستوى الأعلى:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- تطابق الدردشات المباشرة أرقام E.164 مثل `+15555550123`.
- تطابق المجموعات معرّفات JID الخاصة بمجموعات WhatsApp مثل `120363424282127706@g.us`.
- تعمل قوائم السماح للمجموعات، وسياسة المرسلين، وبوابات الإشارة أو التفعيل قبل أن يتأكد OpenClaw من وجود جلسة ACP المكوّنة.
- يمتلك ربط ACP المكوّن والمطابق المسار. لا توسّع مجموعات بث WhatsApp ذلك الدور إلى جلسات WhatsApp العادية.

## سلوك الرقم الشخصي والدردشة الذاتية

عندما يكون رقمك الذاتي المرتبط موجودًا أيضًا في `allowFrom`، تُفعّل وسائل حماية الدردشة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لأدوار الدردشة الذاتية
- تجاهل سلوك التشغيل التلقائي عبر mention-JID الذي كان سيؤدي بخلاف ذلك إلى تنبيه نفسك
- إذا لم يتم ضبط `messages.responsePrefix`، تكون ردود الدردشة الذاتية افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="الغلاف الوارد + سياق الرد">
    تُغلّف رسائل WhatsApp الواردة داخل الغلاف الوارد المشترك.

    إذا وُجد رد مقتبس، يُلحق السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُملأ حقول بيانات الرد الوصفية أيضًا عند توفرها (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).
    عندما يكون هدف الرد المقتبس وسائط قابلة للتنزيل، يحفظه OpenClaw عبر
    مخزن الوسائط الواردة المعتاد ويعرضه كـ `MediaPath`/`MediaType` حتى
    يتمكن الوكيل من فحص الصورة المشار إليها بدلًا من رؤية
    `<media:image>` فقط.

  </Accordion>

  <Accordion title="عناصر نائبة للوسائط واستخراج الموقع/جهة الاتصال">
    تُطبّع الرسائل الواردة التي تحتوي على وسائط فقط بعناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تُنسخ الملاحظات الصوتية المصرح بها في المجموعات قبل بوابة الإشارة عندما يكون
    النص هو `<media:audio>` فقط، لذلك يمكن أن يؤدي قول إشارة الروبوت في الملاحظة الصوتية إلى
    تشغيل الرد. إذا كان النص المنسوخ لا يزال لا يذكر الروبوت، فسيُحتفظ
    بالنص المنسوخ في سجل المجموعة المعلّق بدلًا من العنصر النائب الخام.

    تستخدم نصوص المواقع صياغة إحداثيات موجزة. وتُعرض تسميات/تعليقات المواقع وتفاصيل جهة الاتصال/vCard كبيانات وصفية غير موثوقة داخل كتل مسيجة، وليس كنص مضمّن في الموجه.

  </Accordion>

  <Accordion title="حقن سجل المجموعة المعلّق">
    بالنسبة للمجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عند تشغيل الروبوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - `0` يعطّل ذلك

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="إيصالات القراءة">
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

    تتخطى أدوار الدردشة الذاتية إيصالات القراءة حتى عندما تكون مفعّلة عالميًا.

  </Accordion>
</AccordionGroup>

## التسليم، والتقسيم، والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص">
    - حد التقسيم الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التقسيم الآمن حسب الطول

  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - تُرسل الوسائط الصوتية عبر حمولة Baileys `audio` مع `ptt: true`، لذلك تعرضها عملاء WhatsApp كملاحظة صوتية اضغط للتحدث
    - تحافظ حمولات الرد على `audioAsVoice`؛ يبقى إخراج ملاحظة TTS الصوتية لـ WhatsApp على مسار PTT هذا حتى عندما يعيد الموفر MP3 أو WebM
    - يُرسل صوت Ogg/Opus الأصلي كـ `audio/ogg; codecs=opus` لتوافق الملاحظات الصوتية
    - يُحوّل الصوت غير Ogg، بما في ذلك إخراج Microsoft Edge TTS بصيغة MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي 48 كيلوهرتز قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد من المساعد كملاحظة صوتية واحدة ويمنع الإرسال المتكرر للرد نفسه؛ يتحكم `/tts chat on|off|default` في TTS التلقائي لدردشة WhatsApp الحالية
    - يدعم تشغيل GIF المتحرك عبر `gifPlayback: true` عند إرسال الفيديو
    - يرسل `forceDocument` / `asDocument` الصور وملفات GIF والفيديو الصادرة عبر حمولة مستند Baileys لتجنب ضغط وسائط WhatsApp مع الحفاظ على اسم الملف ونوع MIME المحلولين
    - تُطبّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط، باستثناء ملاحظات PTT الصوتية التي ترسل الصوت أولًا والنص المرئي منفصلًا لأن عملاء WhatsApp لا تعرض تسميات الملاحظات الصوتية باستمرار
    - يمكن أن يكون مصدر الوسائط HTTP(S)، أو `file://`، أو مسارات محلية

  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الاحتياط">
    - حد حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - حد إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسّن الصور تلقائيًا (تغيير الحجم/مسح الجودة) لتناسب الحدود ما لم يطلب `forceDocument` / `asDocument` التسليم كمستند
    - عند فشل إرسال الوسائط، يرسل احتياط العنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الردود

يدعم WhatsApp اقتباس الردود الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم فيه باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | لا تقتبس أبدًا؛ أرسل كرسالة عادية                                  |
| `"first"`   | اقتبس أول جزء فقط من الرد الصادر                             |
| `"all"`     | اقتبس كل جزء من الرد الصادر                                      |
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

## مستوى التفاعلات

يتحكم `channels.whatsapp.reactionLevel` في مدى استخدام الوكيل لتفاعلات الرموز التعبيرية على WhatsApp:

| المستوى         | تفاعلات الإقرار | التفاعلات التي يبدأها الوكيل | الوصف                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | لا            | لا                        | لا توجد تفاعلات مطلقًا                              |
| `"ack"`       | نعم           | لا                        | تفاعلات الإقرار فقط (إيصال قبل الرد)           |
| `"minimal"`   | نعم           | نعم (محافظ)        | الإقرار + تفاعلات الوكيل مع توجيه محافظ |
| `"extensive"` | نعم           | نعم (مشجّع)          | الإقرار + تفاعلات الوكيل مع توجيه مشجّع   |

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
تُحكم تفاعلات الإقرار بواسطة `reactionLevel` — إذ تُمنع عندما يكون `reactionLevel` هو `"off"`.

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
- إذا كان `ackReaction` موجودًا من دون `emoji`، يستخدم WhatsApp رمز هوية الوكيل الموجّه، مع الرجوع إلى "👀"؛ احذف `ackReaction` أو اضبط `emoji: ""` لعدم إرسال تفاعل إقرار
- تُسجّل الإخفاقات لكنها لا تمنع تسليم الرد العادي
- يتفاعل وضع المجموعة `mentions` في الأدوار التي تشغلها الإشارة؛ ويعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp `channels.whatsapp.ackReaction` (لا يُستخدم `messages.ackReaction` القديم هنا)

## تفاعلات حالة دورة الحياة

اضبط `messages.statusReactions.enabled: true` للسماح لـ WhatsApp باستبدال تفاعل الإقرار أثناء الدور بدلًا من ترك رمز إيصال ثابت. عند التفعيل، يستخدم OpenClaw خانة تفاعل الرسالة الواردة نفسها لحالات دورة الحياة مثل الانتظار في الطابور، والتفكير، ونشاط الأدوات، وCompaction، والانتهاء، والخطأ.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

ملاحظات السلوك:

- لا يزال `channels.whatsapp.ackReaction` يتحكم في أهلية تفاعلات الحالة للرسائل المباشرة والمجموعات.
- يستخدم تفاعل حالة الانتظار في الطابور رمز الإقرار الفعّال نفسه كتفاعلات الإقرار العادية.
- لدى WhatsApp خانة تفاعل روبوت واحدة لكل رسالة، لذلك تستبدل تحديثات دورة الحياة التفاعل الحالي في مكانه.
- يمسح `messages.removeAckAfterReply: true` تفاعل الحالة النهائي بعد مدة الاحتفاظ المكوّنة للانتهاء/الخطأ.
- تشمل فئات رموز الأدوات `tool`، و`coding`، و`web`، و`deploy`، و`build`، و`concierge`.

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحسابات والافتراضيات">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودًا، وإلا فأول معرّف حساب مكوّن (مرتّب)
    - تُطبّع معرّفات الحسابات داخليًا للبحث

  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق القديم">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا تزال المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` معروفة/مرحلّة لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يمسح `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب.

    عندما يكون Gateway قابلًا للوصول، يوقف تسجيل الخروج أولًا مستمع WhatsApp المباشر للحساب المحدد حتى لا تستمر الجلسة المرتبطة في تلقي الرسائل حتى إعادة التشغيل التالية. كما يوقف `openclaw channels remove --channel whatsapp` المستمع المباشر قبل تعطيل إعداد الحساب أو حذفه.

    في أدلة المصادقة القديمة، يُحتفظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات الإعداد

- يشمل دعم أدوات الوكيل إجراء تفاعل WhatsApp (`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- كتابات الإعداد التي تبدأها القناة مفعّلة افتراضيًا (عطّلها عبر `channels.whatsapp.configWrites=false`).

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

  <Accordion title="مرتبط لكن غير متصل / حلقة إعادة اتصال">
    العَرَض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    يمكن أن تبقى الحسابات الهادئة متصلة بعد مهلة الرسائل العادية؛ ويُعاد تشغيل المراقب
    عندما يتوقف نشاط نقل WhatsApp Web، أو يُغلق المقبس، أو
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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    إذا استمرت الحلقة بعد إصلاح اتصال المضيف والتوقيتات، فانسخ
    دليل مصادقة الحساب احتياطيا وأعد ربط ذلك الحساب:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    إذا كان `~/.openclaw/logs/whatsapp-health.log` يقول `Gateway inactive` لكن
    `openclaw gateway status` و `openclaw channels status --probe` يظهران أن
    Gateway وWhatsApp سليمان، فشغّل `openclaw doctor`. على Linux، يحذر doctor
    من إدخالات crontab القديمة التي لا تزال تستدعي
    `~/.openclaw/bin/ensure-whatsapp.sh`؛ أزل تلك الإدخالات القديمة باستخدام
    `crontab -e` لأن cron قد يفتقر إلى بيئة ناقل مستخدم systemd ويجعل
    ذلك السكربت القديم يبلّغ عن صحة Gateway بشكل خاطئ.

    إذا لزم الأمر، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="تنتهي مهلة تسجيل الدخول عبر QR خلف وكيل">
    العَرَض: يفشل `openclaw channels login --channel whatsapp` قبل عرض رمز QR قابل للاستخدام مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل دخول WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway (`HTTPS_PROXY` و`HTTP_PROXY` والصيغ بالحروف الصغيرة و`NO_PROXY`). تحقق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل الإرسالات الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway قيد التشغيل وأن الحساب مربوط.

  </Accordion>

  <Accordion title="يظهر الرد في النص المنسوخ لكن لا يظهر في WhatsApp">
    تسجل صفوف النص المنسوخ ما ولّده الوكيل. يتم فحص تسليم WhatsApp بشكل منفصل: لا يعامل OpenClaw الرد التلقائي على أنه مُرسل إلا بعد أن يعيد Baileys معرّف رسالة صادرة لإرسال نص مرئي أو وسائط واحد على الأقل.

    تفاعلات الإقرار هي إيصالات مستقلة قبل الرد. لا يثبت نجاح التفاعل أن الرد النصي أو الإعلامي اللاحق قد قبله WhatsApp.

    تحقق من سجلات Gateway بحثا عن `auto-reply delivery failed` أو `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعة بشكل غير متوقع">
    تحقق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارات (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` (JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذا احتفظ بـ `groupPolicy` واحد لكل نطاق

    إذا كان `channels.whatsapp.groups` موجودا، فلا يزال بإمكان WhatsApp ملاحظة الرسائل من مجموعات أخرى، لكن OpenClaw يسقطها قبل توجيه الجلسة. أضف JID المجموعة إلى `channels.whatsapp.groups` أو أضف `groups["*"]` للسماح بكل المجموعات مع إبقاء تخويل المرسل ضمن `groupPolicy` و`groupAllowFrom`.

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل WhatsApp Gateway Node. يتم وضع علامة على Bun بأنه غير متوافق مع تشغيل WhatsApp/Telegram Gateway المستقر.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات نظام بأسلوب Telegram للمجموعات والدردشات المباشرة عبر خريطتي `groups` و`direct`.

تسلسل الحل الهرمي لرسائل المجموعة:

يتم تحديد خريطة `groups` الفعالة أولا: إذا عرّف الحساب خريطة `groups` خاصة به، فإنها تستبدل خريطة `groups` الجذرية بالكامل (من دون دمج عميق). ثم يعمل البحث عن المطالبة على الخريطة الواحدة الناتجة:

1. **مطالبة نظام خاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة موجودا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يتم إلغاء حرف البدل ولا تُطبق أي مطالبة نظام.
2. **مطالبة نظام بحرف بدل للمجموعة** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائبا تماما عن الخريطة، أو عندما يكون موجودا لكنه لا يعرّف مفتاح `systemPrompt`.

تسلسل الحل الهرمي للرسائل المباشرة:

يتم تحديد خريطة `direct` الفعالة أولا: إذا عرّف الحساب خريطة `direct` خاصة به، فإنها تستبدل خريطة `direct` الجذرية بالكامل (من دون دمج عميق). ثم يعمل البحث عن المطالبة على الخريطة الواحدة الناتجة:

1. **مطالبة نظام خاصة بالمباشر** (`direct["<peerId>"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد موجودا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يتم إلغاء حرف البدل ولا تُطبق أي مطالبة نظام.
2. **مطالبة نظام بحرف بدل للمباشر** (`direct["*"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد غائبا تماما عن الخريطة، أو عندما يكون موجودا لكنه لا يعرّف مفتاح `systemPrompt`.

<Note>
يبقى `dms` حاوية التجاوز الخفيفة لسجل كل DM (`dms.<id>.historyLimit`). تعيش تجاوزات المطالبات ضمن `direct`.
</Note>

**الاختلاف عن سلوك الحسابات المتعددة في Telegram:** في Telegram، يتم إيقاف `groups` الجذرية عمدا لجميع الحسابات في إعداد متعدد الحسابات، حتى الحسابات التي لا تعرّف `groups` خاصة بها، لمنع بوت من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبق WhatsApp هذا الحارس: يتم دائما توريث `groups` الجذرية و`direct` الجذرية بواسطة الحسابات التي لا تعرّف تجاوزا على مستوى الحساب، بغض النظر عن عدد الحسابات المهيأة. في إعداد WhatsApp متعدد الحسابات، إذا كنت تريد مطالبات مجموعات أو مباشرة لكل حساب، فعرّف الخريطة الكاملة ضمن كل حساب صراحة بدلا من الاعتماد على الافتراضات على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هي خريطة تهيئة لكل مجموعة وقائمة سماح للمجموعات على مستوى الدردشة في الوقت نفسه. في نطاق الجذر أو الحساب، تعني `groups["*"]` "يُقبل كل المجموعات" لذلك النطاق.
- لا تضف `systemPrompt` مجموعة بحرف بدل إلا عندما تريد بالفعل أن يقبل ذلك النطاق كل المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` لافتراض المطالبة. بدلا من ذلك، كرر المطالبة في كل إدخال مجموعة مسموح به صراحة.
- قبول المجموعة وتخويل المرسل فحصان منفصلان. توسع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنها لا تخول بحد ذاتها كل مرسل في تلك المجموعات. لا يزال وصول المرسل مضبوطا بشكل منفصل بواسطة `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` الأثر الجانبي نفسه للرسائل المباشرة. لا توفر `direct["*"]` إلا تهيئة افتراضية للدردشة المباشرة بعد قبول DM بالفعل بواسطة `dmPolicy` إضافة إلى `allowFrom` أو قواعد مخزن الاقتران.

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

حقول WhatsApp عالية الدلالة:

- الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- الحسابات المتعددة: `accounts.<id>.enabled`, `accounts.<id>.authDir`, التجاوزات على مستوى الحساب
- العمليات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- سلوك الجلسة: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- المطالبات: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
