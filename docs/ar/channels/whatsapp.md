---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وضوابط الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T13:28:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

الحالة: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). يمتلك Gateway الجلسة (الجلسات) المرتبطة؛ ولا توجد قناة WhatsApp منفصلة عبر Twilio.

## التثبيت

يطالب `openclaw onboard` و`openclaw channels add --channel whatsapp` بتثبيت Plugin في المرة الأولى التي تحدده فيها؛ ويقدم `openclaw channels login --channel whatsapp` مسار التثبيت نفسه إذا كان Plugin مفقودًا. تستخدم نسخ التطوير المستخرجة مسار Plugin المحلي؛ أما عمليات التثبيت المستقرة/التجريبية فتثبت `@openclaw/whatsapp` من ClawHub أولًا، مع الرجوع إلى npm عند التعذر. يُشحن وقت تشغيل WhatsApp خارج حزمة npm الأساسية لـ OpenClaw، لذلك تبقى تبعيات وقت التشغيل الخاصة به مع Plugin الخارجي. التثبيت اليدوي:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

استخدم حزمة npm المجردة (`@openclaw/whatsapp`) فقط للرجوع إلى السجل؛ وثبّت إصدارًا دقيقًا فقط للحصول على تثبيت قابل لإعادة الإنتاج.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إجرائية للإصلاح.
  </Card>
  <Card title="تهيئة Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لتهيئة القناة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="تهيئة سياسة الوصول">

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

    لا يدعم تسجيل الدخول سوى رمز QR. على المضيفين البعيدين أو عديمي الواجهة، وفّر مسارًا موثوقًا لإيصال رمز QR المباشر إلى الهاتف قبل بدء تسجيل الدخول؛ فقد تنتهي صلاحية رموز QR المعروضة في الطرفية أو لقطات الشاشة أو مرفقات الدردشة أثناء النقل.

    لحساب محدد:

```bash
openclaw channels login --channel whatsapp --account work
```

    لإرفاق دليل مصادقة حالي/مخصص قبل تسجيل الدخول:

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

  <Step title="الموافقة على طلب الاقتران الأول (وضع الاقتران)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة؛ ويقتصر عدد الطلبات المعلقة على 3 لكل حساب.

  </Step>
</Steps>

<Note>
يُنصح باستخدام رقم WhatsApp منفصل (إذ جرى تحسين الإعداد والبيانات الوصفية له)، لكن إعدادات الرقم الشخصي/الدردشة الذاتية مدعومة بالكامل.
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    - هوية WhatsApp منفصلة لـ OpenClaw
    - قوائم سماح وحدود توجيه أوضح للرسائل المباشرة
    - احتمال أقل للالتباس في الدردشة الذاتية

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

  <Accordion title="خيار احتياطي للرقم الشخصي">
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب خط أساس ملائمًا للدردشة الذاتية: `dmPolicy: "allowlist"`، و`allowFrom` بما يشمل رقمك، و`selfChatMode: true`. تعتمد وسائل حماية الدردشة الذاتية في وقت التشغيل على الرقم الذاتي المرتبط بالإضافة إلى `allowFrom`.
  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يمتلك Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- تتعقب آلية مراقبة إشارتين بصورة مستقلة: نشاط نقل WhatsApp Web الخام ونشاط رسائل التطبيق. لا تُعاد جلسة هادئة لكنها متصلة لمجرد عدم وصول رسالة مؤخرًا؛ ولا تُفرض إعادة الاتصال إلا عندما تتوقف إطارات النقل عن الوصول خلال نافذة داخلية ثابتة (غير قابلة للتهيئة من المستخدم)، أو تظل رسائل التطبيق صامتة لما يتجاوز 4 أضعاف مهلة الرسائل العادية. بعد إعادة الاتصال مباشرةً لجلسة كانت نشطة مؤخرًا، تستخدم تلك النافذة الأولى مهلة الرسائل العادية الأقصر بدلًا من نافذة 4 أضعاف. يستطيع OpenClaw الرد تلقائيًا على الرسائل غير المتصلة التي يسلّمها Baileys مبكرًا أثناء إعادة الاتصال، ضمن حدود مدة إزالة تكرار معرّف الرسالة الواردة؛ ويحتفظ بدء التشغيل الأولي بحاجز سجل الرسائل القديمة القصير.
- تُحدد توقيتات مقبس Baileys صراحةً ضمن `web.whatsapp.*`: ‏`keepAliveIntervalMs` (الفاصل الزمني لفحص اتصال التطبيق)، و`connectTimeoutMs` (مهلة مصافحة الفتح)، و`defaultQueryTimeoutMs` (انتظار استعلامات Baileys، بالإضافة إلى مهل الإرسال/الحضور الصادر وإيصال القراءة الوارد في OpenClaw).
- تتطلب عمليات الإرسال الصادرة مستمع WhatsApp نشطًا للحساب المستهدف؛ وإلا تفشل عمليات الإرسال فورًا.
- تُرفق عمليات الإرسال إلى المجموعات بيانات وصفية أصلية للإشارة مع رموز `@+<digits>` و`@<digits>` (في النص وتسميات الوسائط) عندما يطابق الرمز البيانات الوصفية الحالية للمشارك، بما في ذلك المجموعات المدعومة بـ LID.
- تُتجاهل محادثات الحالة والبث (`@status`، و`@broadcast`).
- تستخدم المحادثات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ ويؤدي الإعداد الافتراضي `main` إلى دمج الرسائل المباشرة في الجلسة الرئيسية للوكيل). تُعزل جلسات المجموعات لكل JID ‏(`agent:<agentId>:whatsapp:group:<jid>`).
- يمكن تحديد قنوات WhatsApp/النشرات الإخبارية كأهداف صادرة صريحة عبر JID الأصلي `@newsletter`، باستخدام البيانات الوصفية لجلسة القناة (`agent:<agentId>:whatsapp:channel:<jid>`) بدلًا من دلالات الرسائل المباشرة.
- يحترم نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway ‏(`HTTPS_PROXY`، و`HTTP_PROXY`، و`NO_PROXY`، والصيغ ذات الأحرف الصغيرة). فضّل تهيئة الوكيل على مستوى المضيف على الإعدادات الخاصة بكل قناة.
- عند تمكين `messages.removeAckAfterReply`، يزيل OpenClaw تفاعل الإقرار بمجرد تسليم رد مرئي.

## الاتصال بمقدم الطلب الحالي باستخدام MeowCaller (تجريبي)

يمكن لـ Plugin إتاحة `whatsapp_call` في أدوار الوكيل الناشئة من WhatsApp. ويستخدم [MeowCaller](https://github.com/purpshell/meowcaller) لإجراء مكالمة صوتية عبر WhatsApp إلى مقدم الطلب الحالي المصرح له وتشغيل رسالة تحويل النص إلى كلام من OpenClaw بعد الرد. لا تتضمن الأداة معلمة لرقم الوجهة، لذلك لا يمكن للمطالبة إعادة توجيه المكالمة. وهي معطلة افتراضيًا.

<Warning>
MeowCaller تجريبي، ولا يملك إصدارًا موسومًا، ويستخدم جلسة جهاز مرتبط عبر whatsmeow مقترنة بصورة منفصلة — ولا يمكنه إعادة استخدام بيانات اعتماد Baileys الخاصة بـ Plugin. يضيف الاقتران جهازًا مرتبطًا آخر إلى حساب WhatsApp نفسه؛ امسح الرمز باستخدام الهوية التي يستخدمها OpenClaw. لا يمكن لوضع الرقم الشخصي/الدردشة الذاتية الاتصال بنفسه؛ استخدم رقمًا مخصصًا لـ OpenClaw للاتصال برقمك الشخصي.
</Warning>

<Steps>
  <Step title="تمكين المكالمات التجريبية">

    أضف `actions.calls: true` إلى تهيئة قناة WhatsApp وأعد تشغيل Gateway:

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

    عند غيابه أو ضبطه على `false`، لا يتيح OpenClaw أداة `whatsapp_call`.

  </Step>

  <Step title="تثبيت CLI المراجع لـ MeowCaller">

    يتوقع المحول وجود ملف تنفيذي `meowcaller` ضمن `PATH` لمضيف Gateway. إلى أن يُدمج [طلب السحب رقم 7 في MeowCaller](https://github.com/purpshell/meowcaller/pull/7)، ابنِ الفرع المراجع:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    تأكد من وجود `$HOME/.local/bin` ضمن `PATH` لخدمة Gateway. تتضمن هذه المراجعة أوامر `pair` صريحة وأوامر `notify` للإرسال فقط؛ ولا يفتح `notify` أي ميكروفون أو مكبر صوت أو جهاز فيديو أو التقاط تشخيصي. لا تستبدله بأمر `play` من مثال CLI الأصلي.

  </Step>

  <Step title="إقران جهاز MeowCaller المرتبط">

    اطلب من وكيل WhatsApp التحقق من إعداد المكالمات (يبلغ إجراء الحالة `whatsapp_call` عن دليل الحالة الخاص بالحساب وأمر الاقتران). للحساب الافتراضي:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    شغّل هذا تفاعليًا، وامسح رمز QR من **WhatsApp > Linked devices**، وانتظر `MeowCaller linked device ready`. حافظ على خصوصية `wa-voip.db` — فهي جلسة MeowCaller. تحصل الحسابات غير الافتراضية على مسار التخزين الخاص بها من إجراء الحالة؛ وعلى Windows، شغّل أمر PowerShell الخاص بها.

  </Step>

  <Step title="تهيئة تحويل النص إلى كلام والاتصال من WhatsApp">

    هيّئ [موفر تحويل النص إلى كلام](/ar/tools/tts) يدعم الاتصالات الهاتفية، وأعد تشغيل Gateway، ثم أرسل طلبًا مثل `Call me and say the build finished.` تحل الأداة هوية المرسل من السياق الوارد الموثوق، وتنشئ ملف WAV مؤقتًا وخاصًا، وتشغّل MeowCaller خلال نافذة اتصال محدودة، ثم تحذف ملف الصوت بعد ذلك. يمرر OpenClaw مخزن الحساب صراحةً، وينتظر حالة خروج صفرية بعد الرد/التشغيل/إنهاء المكالمة، ويعامل انتهاء المهلة أو حالة الخروج غير الصفرية على أنهما فشل في استدعاء الأداة.

  </Step>
</Steps>

الحدود: مكالمات صوتية صادرة بين طرفين فقط، ولا أرقام وجهات عشوائية، ولا مصادقة مشتركة مع اتصال الدردشة، ولا مكالمات ذاتية من وضع الرقم الشخصي/الدردشة الذاتية، والصوت المركب محدود بـ 60 ثانية، ولا يوجد إيصال يفيد بسماع الصوت من جانب الهاتف بعد اكتمال الرد/التشغيل/إنهاء المكالمة في MeowCaller، ويوقف OpenClaw العملية المصاحبة بعد نافذة محدودة تتراوح بين 115 و175 ثانية (تشمل مراحل الاتصال والرد والتشغيل والإيقاف في MeowCaller).

## مطالبات الموافقة

يمكن لـ WhatsApp عرض مطالبات الموافقة على التنفيذ وPlugin كتفاعلات `👍`/`👎`، وتتحكم فيها تهيئة إعادة توجيه الموافقات ذات المستوى الأعلى:

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

`approvals.exec` و`approvals.plugin` مستقلان؛ فتمكين WhatsApp كقناة لا يفعل سوى ربط النقل، ولا يرسل شيئًا ما لم تكن فئة الموافقات المطابقة مُمكّنة وموجّهة إليها. يسلّم وضع الجلسة موافقات الرموز التعبيرية الأصلية فقط للموافقات التي تنشأ من WhatsApp. يستخدم وضع الهدف مسار إعادة التوجيه المشترك للأهداف الصريحة، ولا ينشئ توزيعًا منفصلًا للرسائل المباشرة على الموافقين.

تتطلب تفاعلات الموافقة في WhatsApp موافقين محددين صراحةً في `allowFrom` (أو `"*"`). يضبط `defaultTo` أهداف الرسائل الافتراضية العادية، وليس قائمة الموافقين. وتظل أوامر `/approve` اليدوية تمر عبر مسار تخويل مرسل WhatsApp المعتاد قبل حسم الموافقة.

## خطافات Plugin والخصوصية

قد تحمل رسائل WhatsApp الواردة محتوى شخصيًا وأرقام هواتف ومعرّفات مجموعات وأسماء مرسلين وحقول ربط الجلسات. لا يبث WhatsApp حمولات خطاف `message_received` الواردة إلى Plugins ما لم تشترك فيها صراحةً:

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

احصر الاشتراك الصريح في حساب واحد ضمن `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. لا تفعّل ذلك إلا لـ Plugins التي تثق بها للتعامل مع محتوى WhatsApp الوارد ومعرّفاته.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    `channels.whatsapp.dmPolicy`:

    | القيمة | السلوك |
    | --- | --- |
    | `pairing` (افتراضي) | يطلب المرسلون غير المعروفين الاقتران؛ ويوافق المالك |
    | `allowlist` | لا يُقبل سوى مرسلي `allowFrom` |
    | `open` | يتطلب أن يتضمن `allowFrom` القيمة `"*"` |
    | `disabled` | حظر جميع الرسائل المباشرة |

    يقبل `allowFrom` أرقامًا بنمط E.164 (تُطبّع داخليًا). وهي قائمة تحكم في وصول مرسلي الرسائل المباشرة فقط — ولا تقيّد عمليات الإرسال الصادرة الصريحة إلى معرّفات JID للمجموعات أو معرّفات JID لقنوات `@newsletter`.

    تجاوز الحسابات المتعددة: تكون الأولوية لـ `channels.whatsapp.accounts.<id>.dmPolicy` (و`.allowFrom`) على الإعدادات الافتراضية على مستوى القناة لذلك الحساب.

    ملاحظات وقت التشغيل:

    - تستمر عمليات الاقتران في مخزن السماح الخاص بالقناة وتندمج مع `allowFrom` المُهيّأ
    - تستخدم الأتمتة المجدولة والوجهة الاحتياطية لمستلم Heartbeat أهداف تسليم صريحة أو `allowFrom` المُهيّأ؛ ولا تُعد موافقات اقتران الرسائل المباشرة مستلمين ضمنيين لـ Cron/Heartbeat
    - إذا لم تُهيّأ قائمة سماح، يُسمح افتراضيًا بالرقم الذاتي المرتبط
    - لا يُجري OpenClaw مطلقًا اقترانًا تلقائيًا لرسائل `fromMe` المباشرة الصادرة (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    يتكون الوصول إلى المجموعات من طبقتين:

    1. **قائمة السماح بعضوية المجموعات** (`channels.whatsapp.groups`): إذا أُغفل `groups`، تكون كل المجموعات مؤهلة؛ وإذا كان موجودًا، فيعمل كقائمة سماح للمجموعات (يسمح `"*"` بالجميع).
    2. **سياسة مرسلي المجموعات** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): يتجاوز `open` قائمة سماح المرسلين، ويتطلب `allowlist` تطابقًا مع `groupAllowFrom` (أو `*`)، ويحظر `disabled` جميع الرسائل الواردة من المجموعات.

    إذا لم يُضبط `groupAllowFrom`، تعود عمليات التحقق من المرسلين إلى `allowFrom` عندما يحتوي على إدخالات. تُقيّم قوائم سماح المرسلين قبل التنشيط بالإشارة/الرد.

    إذا لم توجد كتلة `channels.whatsapp` إطلاقًا، يعود وقت التشغيل إلى `groupPolicy: "allowlist"` (مع تسجيل تحذير)، حتى إذا ضُبط `channels.defaults.groupPolicy` على قيمة أخرى.

    <Note>
    يتضمن تحديد عضوية المجموعات آلية أمان للحساب الواحد: إذا كان حساب WhatsApp واحد فقط مُهيّأً وكان `accounts.<id>.groups` الخاص به كائنًا فارغًا صريحًا (`{}`)، فيُعامل ذلك على أنه «غير مضبوط» ويعود إلى خريطة `channels.whatsapp.groups` الجذرية، بدلًا من حظر كل مجموعة بصمت. عند تهيئة حسابين أو أكثر، تظل خريطة الحساب الفارغة الصريحة فارغة ولا تعود إلى الخريطة الجذرية — ما يتيح لحساب واحد تعطيل جميع المجموعات عمدًا من دون التأثير في الحسابات الأخرى.
    </Note>

  </Tab>

  <Tab title="الإشارات و/activation">
    تتطلب الردود في المجموعات إشارة افتراضيًا. يشمل اكتشاف الإشارات:

    - إشارات WhatsApp الصريحة إلى هوية البوت
    - أنماط التعبيرات النمطية المُهيّأة للإشارات (`agents.list[].groupChat.mentionPatterns`، والبديل `messages.groupChat.mentionPatterns`)
    - نصوص تفريغ الملاحظات الصوتية الواردة لرسائل المجموعات المصرح بها
    - الاكتشاف الضمني للرد على البوت (يطابق مرسل الرد هوية البوت)

    الأمان: لا يحقق الاقتباس/الرد سوى شرط الإشارة — وهو **لا** يمنح المرسل تصريحًا. مع `groupPolicy: "allowlist"`، يظل المرسلون غير المدرجين في قائمة السماح محظورين حتى عند الرد على رسالة مستخدم مدرج في قائمة السماح.

    أمر التنشيط على مستوى الجلسة: `/activation mention` أو `/activation always`. يحدّث هذا حالة الجلسة (وليس الإعداد العام) ويقتصر على المالك.

  </Tab>
</Tabs>

## ارتباطات ACP المُهيّأة

يدعم WhatsApp ارتباطات ACP الدائمة عبر `bindings[]` ذي المستوى الأعلى:

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

تطابق المحادثات المباشرة أرقام E.164؛ وتطابق المجموعات معرّفات JID لمجموعات WhatsApp. تعمل قوائم سماح المجموعات وسياسة المرسلين واشتراط الإشارة/التنشيط قبل أن يضمن OpenClaw وجود جلسة ACP المرتبطة. يمتلك الارتباط المطابق مسار التوجيه — ولا توزّع مجموعات البث ذلك الدور على جلسات WhatsApp العادية.

## سلوك الرقم الشخصي والمحادثة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، تُفعّل ضمانات المحادثة الذاتية: تخطي إيصالات القراءة لأدوار المحادثة الذاتية، وتجاهل سلوك التشغيل التلقائي عبر JID الإشارة الذي قد يرسل تنبيهًا إلى نفسك، واعتماد `[{identity.name}]` (أو `[openclaw]`) افتراضيًا للردود عندما لا يكون `messages.responsePrefix` مضبوطًا.

## تسوية الرسائل والسياق

<AccordionGroup>
  <Accordion title="غلاف الرسائل الواردة وسياق الرد">
    تُغلّف الرسائل الواردة في غلاف الرسائل الواردة المشترك. يضيف الرد المقتبس سياقًا بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُملأ بيانات الرد الوصفية (`ReplyToId`، و`ReplyToBody`، و`ReplyToSender`، ومعرّف JID/E.164 للمرسل) عند توفرها. إذا كان الهدف المقتبس وسائط قابلة للتنزيل، يحفظها OpenClaw عبر مخزن الوسائط الواردة المعتاد ويعرض `MediaPath`/`MediaType` كي يتمكن الوكيل من فحصها مباشرة بدلًا من رؤية `<media:image>` فقط.

  </Accordion>

  <Accordion title="عناصر الوسائط النائبة واستخراج الموقع/جهة الاتصال">
    تُسوّى الرسائل التي تحتوي على وسائط فقط إلى عناصر نائبة: `<media:image>`، و`<media:video>`، و`<media:audio>`، و`<media:document>`، و`<media:sticker>`.

    تُفرّغ الملاحظات الصوتية المصرح بها في المجموعات إلى نص قبل اشتراط الإشارة عندما يكون النص الأساسي هو `<media:audio>` فقط، لذا يمكن لنطق إشارة البوت في الملاحظة الصوتية تشغيل الرد. إذا ظل النص المفرّغ لا يشير إلى البوت، فيبقى في سجل المجموعة المعلق بدلًا من العنصر النائب الخام.

    تُعرض أجسام المواقع كنص إحداثيات موجز. وتُعرض تسميات/تعليقات المواقع وتفاصيل جهات الاتصال/vCard كبيانات وصفية غير موثوقة ضمن سياج، وليس كنص مضمّن في الموجّه.

  </Accordion>

  <Accordion title="إدراج سجل المجموعة المعلق">
    تُخزّن رسائل المجموعة غير المعالجة مؤقتًا وتُدرج كسياق عند تشغيل البوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`، والبديل `messages.groupChat.historyLimit`
    - يؤدي `0` إلى التعطيل

    علامات الإدراج: `[Chat messages since your last reply - for context]` و`[Current message - respond to this]`.

  </Accordion>

  <Accordion title="إيصالات القراءة">
    تكون مفعّلة افتراضيًا للرسائل الواردة المقبولة. لتعطيلها عموميًا:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    التجاوز لكل حساب: `channels.whatsapp.accounts.<id>.sendReadReceipts`. تتخطى أدوار المحادثة الذاتية إيصالات القراءة حتى عندما تكون مفعّلة عموميًا.

  </Accordion>
</AccordionGroup>

## التسليم والتقسيم والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص">
    - حد التقسيم الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`؛ يفضّل `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى تقسيم آمن من حيث الطول

  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - يُرسل الصوت كحمولة Baileys ‏`audio` مع `ptt: true`، ويُعرض كملاحظة صوتية تعمل بالضغط للتحدث؛ ويُحفظ `audioAsVoice` في حمولات الرد لكي يظل إخراج الملاحظة الصوتية لـ TTS على هذا المسار بغض النظر عن تنسيق المصدر لدى المزوّد
    - يُرسل صوت Ogg/Opus الأصلي بصفته `audio/ogg; codecs=opus`؛ ويُحوّل أي تنسيق آخر (بما في ذلك إخراج Microsoft Edge TTS بصيغة MP3/WebM) باستخدام `ffmpeg` إلى Ogg/Opus أحادي القناة بتردد 48 kHz قبل تسليم PTT
    - يرسل `/tts latest` أحدث رد للمساعد كملاحظة صوتية واحدة ويمنع الإرسال المتكرر للرد نفسه؛ ويتحكم `/tts chat on|off|default` في TTS التلقائي للمحادثة الحالية
    - يؤدي `gifPlayback: true` عند إرسال الفيديو إلى تمكين تشغيل GIF المتحرك
    - يوجّه `forceDocument`/`asDocument` الصور وملفات GIF ومقاطع الفيديو الصادرة عبر حمولة مستند Baileys لتجنب ضغط الوسائط في WhatsApp، مع الحفاظ على اسم الملف ونوع MIME اللذين جرى تحديدهما
    - تنطبق التعليقات التوضيحية على أول عنصر وسائط في رد متعدد الوسائط، باستثناء الملاحظات الصوتية PTT: يُرسل الصوت أولًا بلا تعليق توضيحي، ثم يُرسل التعليق التوضيحي كرسالة نصية منفصلة (لا تعرض عملاء WhatsApp تعليقات الملاحظات الصوتية بصورة متسقة)
    - يمكن أن يكون مصدر الوسائط HTTP(S) أو `file://` أو مسارًا محليًا

  </Accordion>

  <Accordion title="حدود حجم الوسائط والسلوك الاحتياطي">
    - الحد الأقصى لحفظ الوسائط الواردة وإرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - التجاوز لكل حساب: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - تُحسّن الصور تلقائيًا (تغيير الحجم/فحص الجودة) لتلائم الحدود ما لم يطلب `forceDocument`/`asDocument` التسليم كمستند
    - عند فشل إرسال الوسائط، يرسل السلوك الاحتياطي للعنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت

  </Accordion>
</AccordionGroup>

## اقتباس الردود

يتحكم `channels.whatsapp.replyToMode` في اقتباس الرد الأصلي (تقتبس الردود الصادرة الرسالة الواردة بشكل ظاهر):

| القيمة             | السلوك                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (الافتراضي) | عدم الاقتباس مطلقًا؛ الإرسال كرسالة عادية                           |
| `"first"`         | اقتباس أول جزء من الرد الصادر فقط                      |
| `"all"`           | اقتباس كل جزء من الرد الصادر                               |
| `"batched"`       | اقتباس الردود المجمّعة الموضوعة في قائمة الانتظار؛ وترك الردود الفورية بلا اقتباس |

التجاوز لكل حساب: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## مستوى التفاعلات

يتحكم `channels.whatsapp.reactionLevel` في مدى استخدام الوكيل لتفاعلات الرموز التعبيرية:

| المستوى                 | تفاعلات الإقرار | التفاعلات التي يبدأها الوكيل  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | لا            | لا                         |
| `"ack"`               | نعم           | لا                         |
| `"minimal"` (الافتراضي) | نعم           | نعم، بتوجيه متحفظ |
| `"extensive"`         | نعم           | نعم، بتوجيه مشجّع   |

التجاوز لكل حساب: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## تفاعلات الإقرار

يرسل `channels.whatsapp.ackReaction` تفاعلًا فوريًا عند استلام رسالة واردة، ويخضع لـ `reactionLevel` (ويُمنع عندما يكون `"off"`):

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // دائمًا | الإشارات | مطلقًا
      },
    },
  },
}
```

ملاحظات: يُرسل فور قبول الرسالة الواردة (قبل الرد)؛ وإذا كان `ackReaction` موجودًا دون `emoji`، يستخدم WhatsApp الرمز التعبيري لهوية الوكيل الموجّه مع الرجوع إلى "👀" (أغفل `ackReaction` أو اضبط `emoji: ""` لعدم إرسال إقرار)؛ تُسجل حالات الفشل لكنها لا تمنع تسليم الرد؛ لا يتفاعل وضع المجموعة `mentions` إلا في الأدوار المشغّلة بالإشارة، بينما يتجاوز تنشيط المجموعة `always` هذا التحقق؛ يستخدم WhatsApp ‏`channels.whatsapp.ackReaction` فقط (ولا ينطبق `messages.ackReaction` القديم هنا).

## تفاعلات حالة دورة الحياة

اضبط `messages.statusReactions.enabled: true` للسماح لـ WhatsApp باستبدال تفاعل الإقرار أثناء الدور بدلًا من ترك رمز إيصال ثابت، مع التنقل عبر حالات مثل قيد الانتظار والتفكير ونشاط الأدوات وCompaction والانتهاء والخطأ:

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

ملاحظات: يظل `channels.whatsapp.ackReaction` متحكمًا في الأهلية للرسائل المباشرة والمجموعات؛ تستخدم حالة قيد الانتظار الرمز التعبيري الفعّال نفسه المستخدم في تفاعلات الإقرار العادية؛ يمتلك WhatsApp خانة تفاعل واحدة للبوت لكل رسالة، لذلك تستبدل تحديثات دورة الحياة التفاعل الحالي في موضعه؛ يمسح `messages.removeAckAfterReply: true` تفاعل الحالة النهائي بعد مدة الاحتفاظ المُهيّأة للانتهاء/الخطأ؛ تشمل فئات الرموز التعبيرية للأدوات `tool`، و`coding`، و`web`، و`deploy`، و`build`، و`concierge`.

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والإعدادات الافتراضية">
    تأتي معرّفات الحسابات من `channels.whatsapp.accounts`. يكون اختيار الحساب الافتراضي هو `default` إن وُجد، وإلا فأول معرّف حساب مُهيأ (مرتب أبجديًا). تُطبَّع معرّفات الحسابات داخليًا للبحث.
  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق مع الإصدارات القديمة">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (النسخة الاحتياطية: `creds.json.bak`)
    - لا تزال مصادقة الحساب الافتراضي القديمة في `~/.openclaw/credentials/` معروفة/تُنقل ضمن تدفقات الحساب الافتراضي

  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يمحو `openclaw channels logout --channel whatsapp [--account <id>]` حالة مصادقة WhatsApp لذلك الحساب. عندما يكون Gateway متاحًا، يوقف تسجيل الخروج المستمع النشط لذلك الحساب أولًا، بحيث تتوقف الجلسة المرتبطة عن تلقي الرسائل قبل إعادة التشغيل التالية. يوقف `openclaw channels remove --channel whatsapp` أيضًا المستمع النشط قبل تعطيل تهيئة الحساب أو حذفها.

    في أدلة المصادقة القديمة، يُحتفظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وعمليات كتابة التهيئة

- يشمل دعم أدوات الوكيل إجراء التفاعل في WhatsApp ‏(`react`).
- بوابات الإجراءات: `channels.whatsapp.actions.reactions`، و`channels.whatsapp.actions.polls` (الإجراءات الحالية افتراضيًا هي `true`)، و`channels.whatsapp.actions.calls` (القيمة الافتراضية `false`، راجع MeowCaller أعلاه).
- تكون عمليات كتابة التهيئة التي تبدأها القناة مفعّلة افتراضيًا؛ عطّلها عبر `channels.whatsapp.configWrites: false`.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (رمز QR مطلوب)">
    العَرَض: تُبلغ حالة القناة بأنها غير مرتبطة.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="مرتبط لكنه منقطع / حلقة إعادة اتصال">
    العَرَض: حساب مرتبط مع انقطاعات أو محاولات إعادة اتصال متكررة.

    يمكن أن تظل الحسابات الهادئة متصلة بعد مهلة الرسائل المعتادة؛ ولا تعيد آلية المراقبة التشغيل إلا عندما يتوقف نشاط نقل WhatsApp Web، أو يُغلق المقبس، أو يظل النشاط على مستوى التطبيق صامتًا بعد نافذة الأمان الأطول (راجع نموذج وقت التشغيل أعلاه).

    إذا أظهرت السجلات تكرار `status=408 Request Time-out Connection was lost`، فاضبط توقيتات مقبس Baileys ضمن `web.whatsapp`. ابدأ بتقصير `keepAliveIntervalMs` إلى أقل من مهلة الخمول لشبكتك وزيادة `connectTimeoutMs` على الاتصالات البطيئة أو كثيرة الفقد:

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

    إذا استمرت الحلقة بعد إصلاح اتصال المضيف والتوقيت، فأنشئ نسخة احتياطية من دليل مصادقة الحساب ثم أعد الربط:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    إذا كان `~/.openclaw/logs/whatsapp-health.log` يقول `Gateway inactive` لكن كلًا من `openclaw gateway status` و`openclaw channels status --probe` يظهر حالة سليمة، فشغّل `openclaw doctor`. على Linux، يحذّر doctor من إدخالات crontab القديمة التي تستدعي السكربت المتقاعد `~/.openclaw/bin/ensure-whatsapp.sh`؛ أزل تلك الإدخالات باستخدام `crontab -e` — قد يفتقر cron إلى بيئة ناقل مستخدم systemd، ما يجعل ذلك السكربت القديم يبلغ خطأً عن سلامة Gateway.

  </Accordion>

  <Accordion title="انتهاء مهلة تسجيل الدخول برمز QR خلف وكيل">
    العَرَض: يفشل `openclaw channels login --channel whatsapp` قبل عرض رمز QR قابل للاستخدام، مع `status=408 Request Time-out` أو انقطاع مقبس TLS.

    يستخدم تسجيل الدخول إلى WhatsApp Web بيئة الوكيل القياسية لمضيف Gateway ‏(`HTTPS_PROXY`، و`HTTP_PROXY`، وصيغهما ذات الأحرف الصغيرة، و`NO_PROXY`). تحقّق من أن عملية Gateway ترث بيئة الوكيل وأن `NO_PROXY` لا يطابق `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل عمليات الإرسال الصادرة فورًا عندما لا يوجد مستمع Gateway نشط للحساب المستهدف. تأكّد من أن Gateway قيد التشغيل وأن الحساب مرتبط.
  </Accordion>

  <Accordion title="يظهر الرد في النص المسجّل ولكن ليس في WhatsApp">
    تسجّل صفوف النص ما أنشأه الوكيل؛ ويُتحقق من التسليم إلى WhatsApp بصورة منفصلة. لا يعدّ OpenClaw الرد التلقائي مُرسلًا إلا بعد أن يعيد Baileys معرّف رسالة صادرة لعملية إرسال واحدة على الأقل من نص أو وسائط مرئية.

    تفاعلات الإقرار هي إيصالات مستقلة تسبق الرد — لا يثبت نجاح التفاعل أن رد النص/الوسائط اللاحق قد قُبل. تحقّق من سجلات Gateway بحثًا عن `auto-reply delivery failed` أو `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="تجاهل رسائل المجموعات على نحو غير متوقع">
    تحقّق بهذا الترتيب: `groupPolicy`، و`groupAllowFrom`/`allowFrom`، وإدخالات قائمة السماح `groups`، وبوابة الإشارة (`requireMention` + أنماط الإشارة)، والمفاتيح المكررة في `openclaw.json` (تتجاوز الإدخالات اللاحقة في JSON5 الإدخالات السابقة — احتفظ بإدخال `groupPolicy` واحد لكل نطاق).

    إذا كان `channels.whatsapp.groups` موجودًا، فلا يزال بإمكان WhatsApp رصد الرسائل من المجموعات الأخرى، لكن OpenClaw يسقطها قبل توجيه الجلسة. أضف JID المجموعة إلى `channels.whatsapp.groups`، أو أضف `groups["*"]` لقبول جميع المجموعات مع إبقاء تخويل المرسل خاضعًا لـ `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    تتطلب بوابات OpenClaw استخدام Node. لا يوفّر Bun واجهة API ‏`node:sqlite` التي يستخدمها مخزن الحالة الأساسي، وينقل doctor خدمات Bun القديمة إلى Node.
  </Accordion>
</AccordionGroup>

## موجّهات النظام

يدعم WhatsApp موجّهات نظام بأسلوب Telegram للمجموعات والمحادثات المباشرة عبر خريطتي `groups` و`direct`.

حل رسائل المجموعات: تُحدد خريطة `groups` الفعالة أولًا — إذا عرّف الحساب مفتاح `groups` الخاص به بأي شكل، فإنه يستبدل خريطة `groups` الجذرية بالكامل (من دون دمج عميق). ثم يُجرى البحث عن الموجّه في تلك الخريطة الناتجة وحدها:

1. **الموجّه الخاص بالمجموعة** (`groups["<groupId>"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة موجودًا **ويكون** مفتاح `systemPrompt` الخاص به معرّفًا. تمنع السلسلة الفارغة (`""`) تطبيق حرف البدل ولا تطبّق أي موجّه.
2. **موجّه حرف البدل للمجموعات** (`groups["*"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحددة غائبًا، أو موجودًا من دون مفتاح `systemPrompt`.

يتبع حل الرسائل المباشرة النمط نفسه تمامًا مع خريطة `direct` و`direct["*"]`.

<Note>
يظل `dms` حاوية التجاوز الخفيفة للسجل لكل رسالة مباشرة (`dms.<id>.historyLimit`). توجد تجاوزات الموجّهات ضمن `direct`.
</Note>

<Note>
سلوك استبدال الحساب للجذر هذا عند حل الموجّهات هو تجاوز سطحي مباشر: يستبدل أي مفتاح `groups`/`direct` في الحساب، بما في ذلك كائن فارغ صريح، الخريطة الجذرية. ويختلف هذا عن فحص قائمة السماح لعضوية المجموعة الموضح أعلاه، الذي يتضمن شبكة أمان للحساب الواحد عند وجود `groups: {}` فارغ عن طريق الخطأ.
</Note>

**الاختلاف عن Telegram:** يمنع Telegram قيمة `groups` الجذرية لكل حساب في إعداد متعدد الحسابات (حتى الحسابات التي لا تملك `groups` خاصًا بها) لمنع الروبوت من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبّق WhatsApp هذا الحاجز — ترث أي حسابات لا تملك تجاوزًا خاصًا بها قيمتي `groups`/`direct` الجذريتين، بصرف النظر عن عدد الحسابات. في إعداد WhatsApp متعدد الحسابات، عرّف الخريطة الكاملة صراحةً ضمن كل حساب إذا كنت تريد موجّهات خاصة بكل حساب.

سلوك مهم:

- يمثّل `channels.whatsapp.groups` خريطة تهيئة لكل مجموعة وقائمة السماح للمجموعات على مستوى المحادثة في آن واحد. على نطاق الجذر أو الحساب، يعني `groups["*"]` «قبول جميع المجموعات» لذلك النطاق.
- لا تضف حرف البدل `systemPrompt` إلا عندما تريد أصلًا أن يقبل ذلك النطاق جميع المجموعات. لإبقاء مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، كرر الموجّه في كل إدخال مسموح به صراحةً بدلًا من استخدام `groups["*"]`.
- قبول المجموعة وتخويل المرسل فحصان منفصلان. يوسّع `groups["*"]` نطاق المجموعات التي تصل إلى معالجة المجموعات؛ لكنه لا يخوّل كل مرسل في تلك المجموعات — إذ يظل ذلك خاضعًا لـ `groupPolicy`/`groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` أثرًا جانبيًا مماثلًا للرسائل المباشرة: لا يوفّر `direct["*"]` سوى تهيئة افتراضية بعد قبول رسالة مباشرة بالفعل بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الاقتران.

مثال:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // لا تستخدمه إلا إذا كان ينبغي قبول جميع المجموعات على نطاق الجذر.
        // ينطبق على جميع الحسابات التي لا تعرّف خريطة groups خاصة بها.
        "*": { systemPrompt: "الموجّه الافتراضي لجميع المجموعات." },
      },
      direct: {
        // ينطبق على جميع الحسابات التي لا تعرّف خريطة direct خاصة بها.
        "*": { systemPrompt: "الموجّه الافتراضي لجميع المحادثات المباشرة." },
      },
      accounts: {
        work: {
          groups: {
            // يعرّف هذا الحساب groups خاصة به، لذا تُستبدل groups الجذرية
            // بالكامل. للاحتفاظ بحرف بدل، عرّف "*" صراحةً هنا أيضًا.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "ركّز على إدارة المشاريع.",
            },
            // لا تستخدمه إلا إذا كان ينبغي قبول جميع المجموعات في هذا الحساب.
            "*": { systemPrompt: "الموجّه الافتراضي لمجموعات العمل." },
          },
          direct: {
            // يعرّف هذا الحساب خريطة direct خاصة به، لذا تُستبدل إدخالات direct
            // الجذرية بالكامل. للاحتفاظ بحرف بدل، عرّف "*" صراحةً هنا أيضًا.
            "+15551234567": { systemPrompt: "موجّه لمحادثة عمل مباشرة محددة." },
            "*": { systemPrompt: "الموجّه الافتراضي لمحادثات العمل المباشرة." },
          },
        },
      },
    },
  },
}
```

## مؤشرات مرجع التهيئة

المرجع الأساسي: [مرجع التهيئة - WhatsApp](/ar/gateway/config-channels#whatsapp)

| المجال            | الحقول                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| الوصول           | `dmPolicy`، `allowFrom`، `groupPolicy`، `groupAllowFrom`، `groups`                                             |
| التسليم          | `textChunkLimit`، `streaming.chunkMode`، `mediaMaxMb`، `sendReadReceipts`، `ackReaction`، `reactionLevel`      |
| تعدد الحسابات    | `accounts.<id>.enabled`، و`accounts.<id>.authDir`، وغيرها من التجاوزات الخاصة بكل حساب                              |
| العمليات         | `configWrites`، `debounceMs`، `web.enabled`، `web.heartbeatSeconds`، `web.reconnect.*`، `web.whatsapp.*`       |
| سلوك الجلسة      | `session.dmScope`، `historyLimit`، `dmHistoryLimit`، `dms.<id>.historyLimit`                                   |
| الموجّهات        | `groups.<id>.systemPrompt`، `groups["*"].systemPrompt`، `direct.<id>.systemPrompt`، `direct["*"].systemPrompt` |

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
