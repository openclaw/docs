---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:40:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

الحالة: جاهز للإنتاج عبر WhatsApp Web (Baileys). يتولى Gateway امتلاك الجلسة/الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يطلب الإعداد الأولي (`openclaw onboard`) و `openclaw channels add --channel whatsapp`
  تثبيت Plugin الخاص بـ WhatsApp في أول مرة تختاره فيها.
- يوفّر `openclaw channels login --channel whatsapp` أيضًا مسار التثبيت عندما
  لا يكون Plugin موجودًا بعد.
- قناة التطوير + نسخة git: تستخدم مسار Plugin المحلي افتراضيًا.
- المستقر/بيتا: يثبّت Plugin الرسمي `@openclaw/whatsapp` من ClawHub
  أولًا، مع npm كخيار احتياطي.
- يُوزَّع وقت تشغيل WhatsApp خارج حزمة OpenClaw الأساسية على npm حتى
  تبقى اعتماديات وقت التشغيل الخاصة بـ WhatsApp مع Plugin الخارجي.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

استخدم حزمة npm المجردة (`@openclaw/whatsapp`) فقط عندما تحتاج إلى خيار الرجوع
إلى السجل. ثبّت إصدارًا محددًا بدقة فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الإقران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وأدلة إصلاح عملية.
  </Card>
  <Card title="إعدادات Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القنوات الكاملة.
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

    تسجيل الدخول الحالي يعتمد على QR. في البيئات البعيدة أو بلا واجهة، تأكد من أن لديك
    مسارًا موثوقًا لإيصال رمز QR الحي إلى الهاتف الذي سيمسحه قبل بدء تسجيل الدخول.

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

  <Step title="الموافقة على طلب الإقران الأول (إذا كنت تستخدم وضع الإقران)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الإقران بعد ساعة واحدة. تُحد الطلبات المعلّقة إلى 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل عند الإمكان. (تكون بيانات القناة الوصفية ومسار الإعداد محسّنين لهذا الإعداد، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

<Warning>
مسار إعداد WhatsApp الحالي يدعم QR فقط. قد تنتهي صلاحية رموز QR المعروضة في الطرفية أو لقطات الشاشة
أو ملفات PDF أو مرفقات الدردشة، أو تصبح غير قابلة للقراءة أثناء تمريرها
من جهاز بعيد. للمضيفين البعيدين/بلا واجهة، فضّل مسار تسليم صورة QR مباشرًا
بدل الالتقاط اليدوي من الطرفية.
</Warning>

## الاتصال بمقدم الطلب الحالي باستخدام MeowCaller (تجريبي)

يمكن لـ Plugin الخاص بـ WhatsApp كشف `whatsapp_call` في أدوار الوكيل الناشئة من WhatsApp. تستخدم الأداة
[MeowCaller](https://github.com/purpshell/meowcaller) لإجراء مكالمة صوتية عبر WhatsApp إلى
مقدم الطلب المخوّل الحالي وتشغّل رسالة OpenClaw TTS بعد أن يجيب. لا تقبل الأداة
رقم وجهة، لذلك لا يمكن للمطالبة إعادة توجيه المكالمة إلى طرف ثالث.
هذه القدرة التجريبية معطلة افتراضيًا.

<Warning>
MeowCaller تجريبي، ولا يملك إصدارًا موسومًا، ويستخدم جلسة جهاز مرتبط منفصلة من whatsmeow.
لا يمكنه إعادة استخدام بيانات اعتماد Baileys الخاصة بـ Plugin WhatsApp. يضيف الإقران
جهازًا مرتبطًا آخر إلى حساب WhatsApp نفسه. امسح باستخدام هوية WhatsApp التي يستخدمها
OpenClaw. لا يمكن لوضع الرقم الشخصي/الدردشة الذاتية الاتصال بنفسه؛ استخدم رقم OpenClaw مخصصًا
للاتصال برقمك الشخصي.
</Warning>

<Steps>
  <Step title="تفعيل المكالمات التجريبية">

    أضف `actions.calls: true` إلى قناة WhatsApp في `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    ادمج هذا في إعداد WhatsApp الحالي لديك، ثم أعد تشغيل Gateway. عندما يكون
    الإعداد غائبًا أو `false`، لا يكشف OpenClaw أداة `whatsapp_call` للوكيل.

  </Step>

  <Step title="تثبيت CLI الخاص بـ MeowCaller الذي تمت مراجعته">

    يتوقع المحوّل وجود ملف تنفيذي باسم `meowcaller` على `PATH` في مضيف Gateway.
    إلى أن يُدمج [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7)، ابنِ
    الفرع الذي تمت مراجعته عند الالتزام `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    تأكد من أن `$HOME/.local/bin` موجود أيضًا على `PATH` لخدمة Gateway. يوفر هذا التنقيح
    أوامر `pair` و `notify` للإرسال فقط بشكل صريح. لا يفتح `notify` أي ميكروفون أو سماعة
    أو جهاز فيديو أو مصرف صوت وارد أو التقاط تشخيصي. لا تستبدله بأمر `play`
    الخاص بـ CLI المثال.

  </Step>

  <Step title="إقران الجهاز المرتبط بـ MeowCaller">

    اطلب من وكيل WhatsApp التحقق من إعداد المكالمات. يبلّغ إجراء حالة `whatsapp_call`
    عن دليل الحالة الخاص بالحساب وأمر الإقران. للحساب الافتراضي:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    شغّل الأمر في طرفية تفاعلية. امسح رمز QR الخاص به من **WhatsApp > الأجهزة المرتبطة**
    وانتظر `MeowCaller linked device ready`. ثم يخرج الأمر. أبقِ `wa-voip.db`
    خاصًا؛ فهو جلسة الجهاز المرتبط الخاصة بـ MeowCaller. يعيد إجراء حالة `whatsapp_call`
    الأمر والصدفة الخاصين بالحساب عندما تستخدم حسابًا غير افتراضي. على
    Windows، شغّل أمر PowerShell الخاص به؛ ينشئ MeowCaller دليل التخزين.

  </Step>

  <Step title="إعداد TTS والاتصال من WhatsApp">

    أعد إعداد [موفر TTS](/ar/tools/tts) قادر على الاتصالات الهاتفية، ثم أعد تشغيل Gateway، ثم أرسل
    طلب WhatsApp مثل `Call me and say the build finished.` تحل الأداة المرسل
    من سياق وارد موثوق، وتولّد ملف WAV مؤقتًا خاصًا، وتشغّل MeowCaller ضمن
    نافذة اتصال محدودة، وتحذف ملف الصوت بعد ذلك. يمرر OpenClaw مخزن الحساب
    صراحة، وينتظر حالة خروج صفرية بعد الإجابة والتشغيل وإنهاء المكالمة، ويتعامل
    مع انتهاء المهلة أو الخروج غير الصفري كمكالمة أداة فاشلة.

  </Step>
</Steps>

الحدود الحالية:

- مكالمات صوتية صادرة فردية فقط
- لا أرقام وجهة عشوائية
- لا مصادقة مشتركة مع اتصال الدردشة
- لا مكالمات ذاتية من وضع الرقم الشخصي/الدردشة الذاتية
- الصوت المولّد محدود إلى 60 ثانية
- لا إيصال سماعية من جهة الهاتف يتجاوز اكتمال الإجابة/التشغيل/إنهاء المكالمة في MeowCaller
- يوقف OpenClaw العملية المرافقة بعد نافذة محدودة من 115 إلى 175 ثانية، بما يشمل
  مراحل اتصال MeowCaller والإجابة والتشغيل والإيقاف

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو أنظف وضع تشغيلي:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح وحدود توجيه أوضح للرسائل المباشرة
    - احتمال أقل لارتباك الدردشة الذاتية

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

  <Accordion title="خيار الرجوع إلى الرقم الشخصي">
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب خط أساس ملائمًا للدردشة الذاتية:

    - `dmPolicy: "allowlist"`
    - يتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تعتمد حمايات الدردشة الذاتية على رقم الذات المرتبط و `allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة قائمة على WhatsApp Web (`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة Twilio WhatsApp منفصلة في سجل قنوات الدردشة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يتولى Gateway امتلاك مقبس WhatsApp وحلقة إعادة الاتصال.
- يستخدم مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط، لذلك لا يُعاد تشغيل جلسة جهاز مرتبط هادئة لمجرد أن لا أحد أرسل رسالة مؤخرًا. لا يزال حد صمت التطبيق الأطول يفرض إعادة اتصال إذا استمرت إطارات النقل في الوصول لكن لم تُعالَج أي رسائل تطبيق خلال نافذة المراقب؛ وبعد إعادة اتصال عابرة لجلسة نشطة مؤخرًا، يستخدم فحص صمت التطبيق هذا مهلة الرسائل العادية لنافذة الاسترداد الأولى.
- توقيتات مقبس Baileys صريحة ضمن `web.whatsapp.*`: يتحكم `keepAliveIntervalMs` في نبضات تطبيق WhatsApp Web، ويتحكم `connectTimeoutMs` في مهلة مصافحة الفتح، ويتحكم `defaultQueryTimeoutMs` في انتظار استعلامات Baileys بالإضافة إلى حدود عمليات الإرسال/الحضور الصادرة المحلية وإيصالات القراءة الواردة في OpenClaw.
- تتطلب الإرسالات الصادرة مستمع WhatsApp نشطًا للحساب الهدف.
- تُرفق إرسالات المجموعات بيانات ذكر وصفية أصلية لرموز `@+<digits>` و `@<digits>` في النص وتسميات الوسائط عندما يطابق الرمز بيانات مشارك WhatsApp الوصفية الحالية، بما في ذلك المجموعات المدعومة بـ LID.
- يتم تجاهل دردشات الحالة والبث (`@status`, `@broadcast`).
- يتبع مراقب إعادة الاتصال نشاط نقل WhatsApp Web، وليس حجم رسائل التطبيق الواردة فقط: تبقى جلسات الأجهزة المرتبطة الهادئة عاملة أثناء استمرار إطارات النقل، لكن توقف النقل يفرض إعادة الاتصال قبل مسار قطع الاتصال البعيد اللاحق بوقت كاف.
- تستخدم الدردشات المباشرة قواعد جلسة الرسائل المباشرة (`session.dmScope`؛ الافتراضي `main` يدمج الرسائل المباشرة في جلسة الوكيل الرئيسية).
- جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يمكن أن تكون قنوات/نشرات WhatsApp أهدافًا صادرة صريحة مع JID الأصلي `@newsletter`. تستخدم إرسالات النشرات الصادرة بيانات جلسة القناة الوصفية (`agent:<agentId>:whatsapp:channel:<jid>`) بدل دلالات جلسة الرسائل المباشرة.
- يحترم نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / المتغيرات الصغيرة). فضّل إعداد الوكيل على مستوى المضيف بدل إعدادات وكيل WhatsApp الخاصة بالقناة.
- عند تفعيل `messages.removeAckAfterReply`، يمسح OpenClaw تفاعل إقرار WhatsApp بعد تسليم رد مرئي.

## مطالبات الموافقة

يمكن لـ WhatsApp عرض مطالبات موافقة التنفيذ وPlugin باستخدام تفاعلات `👍` / `👎`. يتحكم في التسليم
إعداد إعادة توجيه الموافقات في المستوى الأعلى:

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

`approvals.exec` و `approvals.plugin` مستقلان. تفعيل WhatsApp كقناة يربط
النقل فقط؛ ولا يرسل مطالبات موافقة إلا إذا كانت عائلة الموافقة المطابقة مفعلة
وتوجّه إلى WhatsApp. يسلّم وضع الجلسة موافقات الرموز التعبيرية الأصلية فقط للموافقات التي
تنشأ من WhatsApp. يستخدم وضع الهدف مسار إعادة التوجيه المشترك لأهداف WhatsApp
الصريحة ولا ينشئ توسعًا منفصلًا لرسائل مباشرة إلى الموافقين.

تتطلب تفاعلات موافقة WhatsApp موافقين صريحين من WhatsApp من `allowFrom` أو `"*"`.
يتحكم `defaultTo` في أهداف الرسائل الافتراضية العادية؛ وليس موافقًا للموافقة. لا تزال
أوامر `/approve` اليدوية تمر عبر مسار تخويل مرسل WhatsApp العادي قبل
حل الموافقة.

## خطافات Plugin والخصوصية

يمكن أن تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية، وأرقام هواتف،
ومعرّفات مجموعات، وأسماء مرسلين، وحقول ربط للجلسات. لهذا السبب،
لا يبث WhatsApp حِمولات hook الواردة `message_received` إلى Plugins
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

فعّل هذا فقط مع Plugins التي تثق بها لتلقي محتوى رسائل WhatsApp الواردة
والمعرّفات.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى المحادثات المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    يقبل `allowFrom` أرقامًا بنمط E.164 (تُطبّع داخليًا).

    `allowFrom` هو قائمة تحكم في وصول مرسلي الرسائل المباشرة. ولا يقيّد الإرسال الصادر الصريح إلى JIDs مجموعات WhatsApp أو JIDs قنوات `@newsletter`.

    تجاوز الحسابات المتعددة: تكون `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) أسبق من الافتراضيات على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفظ عمليات الاقتران في مخزن السماح للقناة وتُدمج مع `allowFrom` المكوّن
    - تستخدم الأتمتة المجدولة ومستلم Heartbeat الاحتياطي أهداف تسليم صريحة أو `allowFrom` المكوّن؛ موافقات اقتران الرسائل المباشرة ليست مستلمين ضمنيين لـ Cron أو Heartbeat
    - إذا لم تُكوّن أي قائمة سماح، يُسمح بالرقم الذاتي المرتبط افتراضيًا
    - لا يقرن OpenClaw تلقائيًا الرسائل المباشرة الصادرة `fromMe` (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="Group policy + allowlists">
    يتكون وصول المجموعات من طبقتين:

    1. **قائمة السماح بعضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا حُذف `groups`، تكون كل المجموعات مؤهلة
       - إذا كان `groups` موجودًا، فيعمل كقائمة سماح للمجموعات (يُسمح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: تجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر كل الوارد من المجموعات

    احتياطي قائمة سماح المرسلين:

    - إذا لم يُعيّن `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفره
    - تُقيّم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` على الإطلاق، فسيكون احتياطي سياسة المجموعات في وقت التشغيل هو `allowlist` (مع سجل تحذير)، حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا.

  </Tab>

  <Tab title="Mentions + /activation">
    تتطلب ردود المجموعات الإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة:

    - إشارات WhatsApp الصريحة إلى هوية البوت
    - أنماط تعبيرات الإشارة النظامية المكوّنة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - نصوص ملاحظات الصوت الواردة لرسائل المجموعات المصرح بها
    - اكتشاف الرد الضمني على البوت (يطابق مرسل الرد هوية البوت)

    ملاحظة أمنية:

    - يحقق الاقتباس/الرد شرط بوابة الإشارة فقط؛ ولا يمنح تفويض المرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير المدرجين في قائمة السماح محظورين حتى إذا ردوا على رسالة مستخدم مدرج في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس الإعداد العام). وهو مقيّد بالمالك.

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

- تطابق المحادثات المباشرة أرقام E.164 مثل `+15555550123`.
- تطابق المجموعات JIDs مجموعات WhatsApp مثل `120363424282127706@g.us`.
- تعمل قوائم سماح المجموعات، وسياسة المرسل، وبوابة الإشارة أو التفعيل قبل أن يضمن OpenClaw وجود جلسة ACP المكوّنة.
- يملك ارتباط ACP مكوّن ومطابق المسار. لا تفرّع مجموعات بث WhatsApp تلك الجولة إلى جلسات WhatsApp عادية.

## سلوك الرقم الشخصي والمحادثة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، تُفعّل وسائل حماية المحادثة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لجولات المحادثة الذاتية
- تجاهل سلوك التشغيل التلقائي عبر mention-JID الذي كان سيؤدي بخلاف ذلك إلى تنبيه نفسك
- إذا لم يُعيّن `messages.responsePrefix`، تكون ردود المحادثة الذاتية افتراضيًا `[{identity.name}]` أو `[openclaw]`

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

    تُملأ أيضًا حقول بيانات الرد الوصفية عند توفرها (`ReplyToId`، `ReplyToBody`، `ReplyToSender`، وJID/E.164 المرسل).
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

    تُنسخ ملاحظات الصوت للمجموعات المصرح بها قبل بوابة الإشارة عندما يكون
    النص هو `<media:audio>` فقط، ولذلك يمكن أن يؤدي ذكر البوت في ملاحظة الصوت
    إلى تشغيل الرد. إذا ظل النص لا يذكر البوت، فيُحتفظ بالنص في سجل المجموعة المعلق بدلًا من العنصر النائب الخام.

    تستخدم أجسام الموقع نص إحداثيات موجزًا. تُعرض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات وصفية غير موثوقة داخل أسوار، وليس كنص مطالبة مضمّن.

  </Accordion>

  <Accordion title="Pending group history injection">
    بالنسبة للمجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يُشغّل البوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - `0` يعطّل ذلك

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
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

    تتخطى جولات المحادثة الذاتية إيصالات القراءة حتى عند تفعيلها عالميًا.

  </Accordion>
</AccordionGroup>

## التسليم، والتقسيم إلى أجزاء، والوسائط

<AccordionGroup>
  <Accordion title="Text chunking">
    - حد الجزء الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التقسيم الآمن حسب الطول

  </Accordion>

  <Accordion title="Outbound media behavior">
    - يدعم حِمولات الصور، والفيديو، والصوت (ملاحظة صوتية PTT)، والمستندات
    - تُرسل الوسائط الصوتية عبر حمولة Baileys `audio` مع `ptt: true`، ولذلك تعرضها عملاء WhatsApp كملاحظة صوتية اضغط للتحدث
    - تحافظ حِمولات الرد على `audioAsVoice`؛ ويبقى خرج ملاحظة الصوت من TTS لـ WhatsApp على مسار PTT هذا حتى عندما يعيد المزوّد MP3 أو WebM
    - يُرسل صوت Ogg/Opus الأصلي كـ `audio/ogg; codecs=opus` لتوافق ملاحظات الصوت
    - يُحوّل الصوت غير Ogg، بما في ذلك خرج Microsoft Edge TTS بصيغة MP3/WebM، باستخدام `ffmpeg` إلى Ogg/Opus أحادي القناة بتردد 48 كيلوهرتز قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد من المساعد كملاحظة صوتية واحدة ويمنع تكرار الإرسال للرد نفسه؛ يتحكم `/tts chat on|off|default` في TTS التلقائي لمحادثة WhatsApp الحالية
    - يُدعم تشغيل GIF المتحرك عبر `gifPlayback: true` عند إرسال الفيديو
    - يرسل `forceDocument` / `asDocument` الصور وGIFs والفيديوهات الصادرة عبر حمولة مستند Baileys لتجنب ضغط وسائط WhatsApp مع الحفاظ على اسم الملف المحلول ونوع MIME
    - تُطبق التسميات التوضيحية على أول عنصر وسائط عند إرسال حِمولات رد متعددة الوسائط، باستثناء أن ملاحظات الصوت PTT ترسل الصوت أولًا والنص المرئي بشكل منفصل لأن عملاء WhatsApp لا يعرضون تسميات ملاحظات الصوت التوضيحية باستمرار
    - يمكن أن يكون مصدر الوسائط HTTP(S)، أو `file://`، أو مسارات محلية

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - سقف حفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - سقف إرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسّن الصور تلقائيًا (مسح تغيير الحجم/الجودة) لتلائم الحدود ما لم يطلب `forceDocument` / `asDocument` التسليم كمستند
    - عند فشل إرسال الوسائط، يرسل احتياطي العنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الردود

يدعم WhatsApp اقتباس الردود الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم به باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | لا تقتبس أبدًا؛ أرسل كرسالة عادية                                  |
| `"first"`   | اقتبس جزء الرد الصادر الأول فقط                             |
| `"all"`     | اقتبس كل جزء من الرد الصادر                                      |
| `"batched"` | اقتبس الردود المجمعة في الطابور مع ترك الردود الفورية غير مقتبسة |

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

| المستوى       | تفاعلات الإقرار | تفاعلات يبدأها الوكيل | الوصف                                           |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | لا            | لا                        | لا توجد تفاعلات إطلاقًا                              |
| `"ack"`       | نعم           | لا                        | تفاعلات الإقرار فقط (إيصال قبل الرد)           |
| `"minimal"`   | نعم           | نعم (محافظة)        | إقرار + تفاعلات الوكيل مع إرشادات محافظة |
| `"extensive"` | نعم           | نعم (مستحسنة)          | إقرار + تفاعلات الوكيل مع إرشادات مستحسنة   |

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

يدعم WhatsApp تفاعلات الإقرار الفورية عند استلام الوارد عبر `channels.whatsapp.ackReaction`.
تُقيّد تفاعلات الإقرار بواسطة `reactionLevel` — إذ تُحجب عندما يكون `reactionLevel` هو `"off"`.

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

- يُرسل فورًا بعد قبول الوارد (قبل الرد)
- إذا كان `ackReaction` موجودًا من دون `emoji`، يستخدم WhatsApp رمز الهوية التعبيري للوكيل الموجَّه إليه، مع الرجوع إلى "👀"؛ احذف `ackReaction` أو عيّن `emoji: ""` لعدم إرسال أي تفاعل إقرار
- تُسجَّل الإخفاقات لكنها لا تمنع تسليم الرد العادي
- يتفاعل وضع المجموعة `mentions` في الأدوار التي تُشغَّل بالإشارة؛ ويعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp ‏`channels.whatsapp.ackReaction` (لا يُستخدم `messages.ackReaction` القديم هنا)

## تفاعلات حالة دورة الحياة

عيّن `messages.statusReactions.enabled: true` للسماح لـ WhatsApp باستبدال تفاعل الإقرار أثناء الدور بدلًا من ترك رمز تعبيري ثابت للإيصال. عند التفعيل، يستخدم OpenClaw خانة تفاعل الرسالة الواردة نفسها لحالات دورة الحياة مثل في قائمة الانتظار، والتفكير، ونشاط الأداة، وCompaction، والانتهاء، والخطأ.

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
- يستخدم تفاعل حالة قائمة الانتظار رمز الإقرار الفعّال نفسه المستخدم في تفاعلات الإقرار العادية.
- لدى WhatsApp خانة تفاعل واحدة للبوت لكل رسالة، لذلك تستبدل تحديثات دورة الحياة التفاعل الحالي في مكانه.
- يمسح `messages.removeAckAfterReply: true` تفاعل الحالة النهائي بعد مدة الاحتفاظ المُهيأة للانتهاء/الخطأ.
- تشمل فئات رموز الأدوات التعبيرية `tool` و`coding` و`web` و`deploy` و`build` و`concierge`.

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والإعدادات الافتراضية">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودًا، وإلا فأول معرّف حساب مُهيأ (بعد الفرز)
    - تُطبَّع معرّفات الحسابات داخليًا للبحث

  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق القديم">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخة الاحتياطية: `creds.json.bak`
    - لا تزال المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` معروفة/مُرحَّلة لتدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يمسح `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب.

    عندما يكون Gateway قابلًا للوصول، يوقف تسجيل الخروج أولًا مستمع WhatsApp الحي للحساب المحدد حتى لا تواصل الجلسة المرتبطة تلقي الرسائل حتى إعادة التشغيل التالية. يوقف `openclaw channels remove --channel whatsapp` أيضًا المستمع الحي قبل تعطيل إعدادات الحساب أو حذفها.

    في أدلة المصادقة القديمة، يُحتفظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات الإعدادات

- يتضمن دعم أداة الوكيل إجراء تفاعل WhatsApp (`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- كتابات الإعدادات التي تبدأها القناة مفعّلة افتراضيًا (عطّلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (يتطلب QR)">
    العرض: تُبلغ حالة القناة أنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكن مفصول / حلقة إعادة اتصال">
    العرض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    يمكن للحسابات الهادئة أن تبقى متصلة بعد مهلة الرسائل العادية؛ يُعاد تشغيل المراقب
    عندما يتوقف نشاط نقل WhatsApp Web، أو يُغلق المقبس، أو
    يبقى النشاط على مستوى التطبيق صامتًا بعد نافذة الأمان الأطول.

    إذا عرضت السجلات `status=408 Request Time-out Connection was lost` بشكل متكرر، فاضبط
    توقيتات مقبس Baileys ضمن `web.whatsapp`. ابدأ بتقصير
    `keepAliveIntervalMs` ليصبح أقل من مهلة الخمول في شبكتك وزيادة
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

    إذا استمرت الحلقة بعد إصلاح اتصال المضيف والتوقيت، فانسخ احتياطيًا
    دليل مصادقة الحساب وأعد ربط ذلك الحساب:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    إذا كان `~/.openclaw/logs/whatsapp-health.log` يقول `Gateway inactive` لكن
    `openclaw gateway status` و`openclaw channels status --probe` يُظهران أن
    Gateway وWhatsApp سليمان، فشغّل `openclaw doctor`. على Linux، يحذّر doctor
    من إدخالات crontab القديمة التي لا تزال تستدعي
    `~/.openclaw/bin/ensure-whatsapp.sh`؛ أزل هذه الإدخالات القديمة باستخدام
    `crontab -e` لأن cron قد يفتقر إلى بيئة ناقل مستخدم systemd وقد
    يجعل ذلك السكربت القديم يسيء الإبلاغ عن صحة Gateway.

    عند الحاجة، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="تنتهي مهلة تسجيل الدخول عبر QR خلف وكيل">
    العرض: يفشل `openclaw channels login --channel whatsapp` قبل عرض رمز QR صالح للاستخدام مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل دخول WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway (`HTTPS_PROXY` و`HTTP_PROXY` والمتغيرات بالحروف الصغيرة و`NO_PROXY`). تحقّق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل عمليات الإرسال الصادرة سريعًا عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway قيد التشغيل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يظهر الرد في النص المنسوخ لكن ليس في WhatsApp">
    تسجل صفوف النص المنسوخ ما أنشأه الوكيل. يُفحص تسليم WhatsApp بشكل منفصل: لا يتعامل OpenClaw مع الرد التلقائي على أنه مُرسل إلا بعد أن يعيد Baileys معرّف رسالة صادرة لإرسال نص مرئي أو وسائط واحدة على الأقل.

    تفاعلات الإقرار هي إيصالات مستقلة قبل الرد. لا يثبت التفاعل الناجح أن الرد النصي أو الإعلامي اللاحق قد قبله WhatsApp.

    افحص سجلات Gateway بحثًا عن `auto-reply delivery failed` أو `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعة بشكل غير متوقع">
    افحص بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارات (`requireMention` + أنماط الإشارات)
    - المفاتيح المكررة في `openclaw.json` (JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذلك احتفظ بـ `groupPolicy` واحد فقط لكل نطاق

    إذا كان `channels.whatsapp.groups` موجودًا، فلا يزال WhatsApp قادرًا على ملاحظة الرسائل من مجموعات أخرى، لكن OpenClaw يسقطها قبل توجيه الجلسة. أضف JID المجموعة إلى `channels.whatsapp.groups` أو أضف `groups["*"]` لقبول جميع المجموعات مع إبقاء تخويل المرسِل تحت `groupPolicy` و`groupAllowFrom`.

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل Gateway الخاص بـ WhatsApp ‏Node. يُعلَّم Bun على أنه غير متوافق مع التشغيل المستقر لـ Gateway الخاص بـ WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## مطالبات النظام

يدعم WhatsApp مطالبات نظام بأسلوب Telegram للمجموعات والمحادثات المباشرة عبر خريطتي `groups` و`direct`.

هرمية الحل لرسائل المجموعات:

تُحدَّد خريطة `groups` الفعّالة أولًا: إذا عرّف الحساب `groups` الخاصة به، فإنها تستبدل بالكامل خريطة `groups` الجذرية (من دون دمج عميق). ثم يُجرى بحث المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة النظام الخاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يُكبَت حرف البدل ولا تُطبَّق أي مطالبة نظام.
2. **مطالبة نظام حرف البدل للمجموعات** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

هرمية الحل للرسائل المباشرة:

تُحدَّد خريطة `direct` الفعّالة أولًا: إذا عرّف الحساب `direct` الخاصة به، فإنها تستبدل بالكامل خريطة `direct` الجذرية (من دون دمج عميق). ثم يُجرى بحث المطالبة على الخريطة المفردة الناتجة:

1. **مطالبة النظام الخاصة بالمباشر** (`direct["<peerId>"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`)، يُكبَت حرف البدل ولا تُطبَّق أي مطالبة نظام.
2. **مطالبة نظام حرف البدل للمباشر** (`direct["*"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

<Note>
يبقى `dms` وعاء التجاوز الخفيف للسجل لكل رسالة مباشرة (`dms.<id>.historyLimit`). تعيش تجاوزات المطالبات ضمن `direct`.
</Note>

**الاختلاف عن سلوك الحسابات المتعددة في Telegram:** في Telegram، تُكبَت `groups` الجذرية عمدًا لكل الحسابات في إعداد متعدد الحسابات، حتى الحسابات التي لا تعرّف `groups` خاصة بها، لمنع بوت من تلقي رسائل مجموعة لمجموعات لا ينتمي إليها. لا يطبّق WhatsApp هذا الحارس: تُورَّث `groups` الجذرية و`direct` الجذرية دائمًا بواسطة الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المُهيأة. في إعداد WhatsApp متعدد الحسابات، إذا أردت مطالبات مجموعة أو مباشرة لكل حساب، فعرّف الخريطة الكاملة ضمن كل حساب صراحة بدلًا من الاعتماد على الإعدادات الافتراضية على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هو خريطة إعدادات لكل مجموعة وقائمة سماح للمجموعات على مستوى المحادثة في الوقت نفسه. في نطاق الجذر أو الحساب، تعني `groups["*"]` أن "كل المجموعات مقبولة" لذلك النطاق.
- لا تضف `systemPrompt` لمجموعة بحرف بدل إلا عندما تريد بالفعل أن يقبل ذلك النطاق كل المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كافتراضي للمطالبة. بدلًا من ذلك، كرر المطالبة في كل إدخال مجموعة مسموح به صراحة.
- قبول المجموعة وتخويل المرسِل فحصان منفصلان. يوسّع `groups["*"]` مجموعة المجموعات التي يمكنها الوصول إلى معالجة المجموعات، لكنه لا يخول بحد ذاته كل مرسِل في تلك المجموعات. لا يزال وصول المرسِل مضبوطًا بشكل منفصل بواسطة `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` الأثر الجانبي نفسه للرسائل المباشرة. لا يوفر `direct["*"]` إلا إعداد محادثة مباشرة افتراضيًا بعد قبول الرسالة المباشرة بالفعل بواسطة `dmPolicy` إضافة إلى `allowFrom` أو قواعد مخزن الاقتران.

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
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
