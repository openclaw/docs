---
read_when:
    - إقران iOS Node أو إعادة توصيله
    - تشغيل تطبيق iOS من المصدر
    - تصحيح أخطاء اكتشاف Gateway أو أوامر canvas
summary: 'تطبيق العقدة على iOS: الاتصال بـ Gateway، والإقران، ولوحة الرسم، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
    generated_at: "2026-05-07T13:24:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

التوفر: معاينة داخلية. تطبيق iOS غير موزع للعامة بعد.

## ما الذي يفعله

- يتصل بـ Gateway عبر WebSocket (شبكة LAN أو tailnet).
- يكشف قدرات العقدة: Canvas، ولقطة الشاشة، والتقاط الكاميرا، والموقع، ووضع التحدث، والتنبيه الصوتي.
- يتلقى أوامر `node.invoke` ويبلّغ عن أحداث حالة العقدة.

## المتطلبات

- Gateway يعمل على جهاز آخر (macOS أو Linux أو Windows عبر WSL2).
- مسار الشبكة:
  - الشبكة المحلية نفسها عبر Bonjour، **أو**
  - Tailnet عبر DNS-SD أحادي الإرسال (نطاق مثال: `openclaw.internal.`)، **أو**
  - مضيف/منفذ يدوي (احتياطي).

## البدء السريع (الاقتران + الاتصال)

1. شغّل Gateway:

```bash
openclaw gateway --port 18789
```

2. في تطبيق iOS، افتح الإعدادات واختر gateway مكتشفًا (أو فعّل Manual Host وأدخل المضيف/المنفذ).

3. وافق على طلب الاقتران على مضيف gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد التطبيق محاولة الاقتران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيُستبدل الطلب السابق المعلق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

اختياري: إذا كانت عقدة iOS تتصل دائمًا من شبكة فرعية محكمة التحكم، يمكنك
تفعيل الموافقة التلقائية لأول مرة على العقدة باستخدام CIDR صريحة أو عناوين IP دقيقة:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

هذا معطل افتراضيًا. ينطبق فقط على اقتران `role: node` جديد
بلا نطاقات مطلوبة. لا يزال اقتران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام يتطلب موافقة يدوية.

4. تحقق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## الدفع المدعوم بالترحيل للبُنى الرسمية

تستخدم بُنى iOS الرسمية الموزعة مرحّل الدفع الخارجي بدلًا من نشر رمز APNs الخام
إلى gateway.

متطلب جهة Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

كيف يعمل التدفق:

- يسجل تطبيق iOS لدى المرحّل باستخدام App Attest ومعاملة تطبيق StoreKit بصيغة JWS.
- يعيد المرحّل معرّف ترحيل مبهمًا مع منحة إرسال مقيّدة بالتسجيل.
- يجلب تطبيق iOS هوية gateway المقترن ويضمّنها في تسجيل المرحّل، وبذلك يُفوّض التسجيل المدعوم بالترحيل إلى ذلك gateway المحدد.
- يمرر التطبيق ذلك التسجيل المدعوم بالترحيل إلى gateway المقترن باستخدام `push.apns.register`.
- يستخدم gateway معرّف الترحيل المخزن هذا لـ `push.test`، والتنبيهات الخلفية، ودفعات التنبيه.
- يجب أن يطابق عنوان URL الأساسي لمرحل gateway عنوان URL للمرحل المضمّن في بنية iOS الرسمية/TestFlight.
- إذا اتصل التطبيق لاحقًا بـ gateway مختلف أو ببنية ذات عنوان URL أساسي مختلف للمرحل، فإنه يحدّث تسجيل المرحّل بدلًا من إعادة استخدام الربط القديم.

ما لا يحتاج إليه gateway في هذا المسار:

- لا رمز ترحيل على مستوى النشر.
- لا مفتاح APNs مباشر للإرسالات الرسمية/TestFlight المدعومة بالترحيل.

تدفق المشغل المتوقع:

1. ثبّت بنية iOS الرسمية/TestFlight.
2. عيّن `gateway.push.apns.relay.baseUrl` على gateway.
3. اقرن التطبيق بـ gateway واتركه يكمل الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائيًا بعد حصوله على رمز APNs، واتصال جلسة المشغّل، ونجاح تسجيل المرحّل.
5. بعد ذلك، يمكن لـ `push.test` وتنبيهات إعادة الاتصال ودفعات التنبيه استخدام التسجيل المخزن المدعوم بالترحيل.

## إشارات البقاء حيًا في الخلفية

عندما يوقظ iOS التطبيق بسبب دفع صامت، أو تحديث في الخلفية، أو حدث موقع مهم، يحاول التطبيق
إعادة اتصال قصيرة للعقدة ثم يستدعي `node.event` مع `event: "node.presence.alive"`.
يسجل gateway ذلك بوصفه `lastSeenAtMs`/`lastSeenReason` في البيانات الوصفية للعقدة/الجهاز المقترن فقط
بعد معرفة هوية جهاز العقدة المصادق عليها.

يعد التطبيق التنبيه الخلفي مسجلًا بنجاح فقط عندما تتضمن استجابة gateway
`handled: true`. قد تقر gateways الأقدم بـ `node.event` مع `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحسب كتحديث دائم لآخر ظهور.

ملاحظة التوافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز مؤقت عبر env لـ gateway.

## المصادقة وتدفق الثقة

يوجد المرحّل لفرض قيدين لا يمكن لـ APNs المباشر على gateway توفيرهما
لبُنى iOS الرسمية:

- يمكن فقط لبُنى OpenClaw iOS الأصلية الموزعة عبر Apple استخدام المرحّل المستضاف.
- يمكن لـ gateway إرسال دفعات مدعومة بالترحيل فقط لأجهزة iOS التي اقترنت بذلك
  gateway المحدد.

قفزةً بقفزة:

1. `iOS app -> gateway`
   - يقترن التطبيق أولًا بـ gateway عبر تدفق مصادقة Gateway المعتاد.
   - يمنح ذلك التطبيق جلسة عقدة مصادقًا عليها بالإضافة إلى جلسة مشغّل مصادق عليها.
   - تُستخدم جلسة المشغّل لاستدعاء `gateway.identity.get`.

2. `iOS app -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل المرحّل عبر HTTPS.
   - يتضمن التسجيل إثبات App Attest بالإضافة إلى معاملة تطبيق StoreKit بصيغة JWS.
   - يتحقق المرحّل من معرّف الحزمة، وإثبات App Attest، وإثبات توزيع Apple، ويتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - هذا ما يمنع بُنى Xcode/dev المحلية من استخدام المرحّل المستضاف. قد تكون البنية المحلية
     موقعة، لكنها لا تستوفي إثبات توزيع Apple الرسمي الذي يتوقعه المرحّل.

3. `gateway identity delegation`
   - قبل تسجيل المرحّل، يجلب التطبيق هوية gateway المقترن من
     `gateway.identity.get`.
   - يضمّن التطبيق هوية gateway تلك في حمولة تسجيل المرحّل.
   - يعيد المرحّل معرّف ترحيل ومنحة إرسال مقيّدة بالتسجيل ومفوّضة إلى
     هوية gateway تلك.

4. `gateway -> relay`
   - يخزن gateway معرّف الترحيل ومنحة الإرسال من `push.apns.register`.
   - عند `push.test` وتنبيهات إعادة الاتصال ودفعات التنبيه، يوقّع gateway طلب الإرسال باستخدام
     هوية جهازه الخاصة.
   - يتحقق المرحّل من منحة الإرسال المخزنة وتوقيع gateway مقابل هوية
     gateway المفوّضة من التسجيل.
   - لا يمكن لـ gateway آخر إعادة استخدام ذلك التسجيل المخزن، حتى لو حصل بطريقة ما على المعرّف.

5. `relay -> APNs`
   - يمتلك المرحّل بيانات اعتماد APNs الإنتاجية ورمز APNs الخام للبنية الرسمية.
   - لا يخزن gateway أبدًا رمز APNs الخام للبُنى الرسمية المدعومة بالترحيل.
   - يرسل المرحّل الدفع النهائي إلى APNs نيابةً عن gateway المقترن.

سبب إنشاء هذا التصميم:

- إبقاء بيانات اعتماد APNs الإنتاجية خارج gateways المستخدمين.
- تجنب تخزين رموز APNs الخام لبُنى رسمية على gateway.
- السماح باستخدام المرحّل المستضاف فقط لبُنى OpenClaw الرسمية/TestFlight.
- منع gateway واحد من إرسال دفعات تنبيه إلى أجهزة iOS مملوكة لـ gateway مختلف.

تبقى البُنى المحلية/اليدوية على APNs المباشر. إذا كنت تختبر تلك البُنى من دون المرحّل، فلا يزال
gateway يحتاج إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات env وقت التشغيل لمضيف gateway، وليست إعدادات Fastlane. يخزن `apps/ios/fastlane/.env` فقط
مصادقة App Store Connect / TestFlight مثل `ASC_KEY_ID` و`ASC_ISSUER_ID`؛ ولا يضبط
تسليم APNs المباشر لبُنى iOS المحلية.

التخزين الموصى به على مضيف gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تلتزم ملف `.p8` أو تضعه تحت نسخة المستودع المستخرجة.

## مسارات الاكتشاف

### Bonjour (LAN)

يتصفح تطبيق iOS `_openclaw-gw._tcp` على `local.`، وعند ضبطه، نطاق اكتشاف DNS-SD واسع النطاق نفسه. تظهر gateways الموجودة على الشبكة المحلية نفسها تلقائيًا من `local.`؛
يمكن للاكتشاف عبر الشبكات استخدام النطاق واسع النطاق المضبوط من دون تغيير نوع المنارة.

### Tailnet (عبر الشبكات)

إذا كان mDNS محظورًا، فاستخدم منطقة DNS-SD أحادية الإرسال (اختر نطاقًا؛ مثال:
`openclaw.internal.`) وTailscale split DNS.
راجع [Bonjour](/ar/gateway/bonjour) للاطلاع على مثال CoreDNS.

### المضيف/المنفذ اليدوي

في الإعدادات، فعّل **Manual Host** وأدخل مضيف gateway + المنفذ (الافتراضي `18789`).

## Canvas + A2UI

تعرض عقدة iOS لوحة WKWebView. استخدم `node.invoke` للتحكم بها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يستضيف مضيف Canvas في Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- يُقدّم من خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`، الافتراضي `18789`).
- تنتقل عقدة iOS تلقائيًا إلى A2UI عند الاتصال عندما يُعلن عن عنوان URL لمضيف Canvas.
- عُد إلى القالب المدمج باستخدام `canvas.navigate` و`{"url":""}`.

## العلاقة مع Computer Use

تطبيق iOS هو سطح عقدة محمول، وليس خلفية Codex Computer Use. يتحكم Codex
Computer Use و`cua-driver mcp` في سطح مكتب macOS محلي عبر أدوات MCP؛
يكشف تطبيق iOS قدرات iPhone عبر أوامر عقدة OpenClaw
مثل `canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

لا يزال بإمكان الوكلاء تشغيل تطبيق iOS عبر OpenClaw باستدعاء أوامر العقدة،
لكن هذه الاستدعاءات تمر عبر بروتوكول عقدة gateway وتتبع حدود iOS
في المقدمة/الخلفية. استخدم [Codex Computer Use](/ar/plugins/codex-computer-use)
للتحكم في سطح المكتب المحلي وهذه الصفحة لقدرات عقدة iOS.

### تقييم Canvas / اللقطة

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## التنبيه الصوتي + وضع التحدث

- يتوفر التنبيه الصوتي ووضع التحدث في الإعدادات.
- تعلن عقد iOS القادرة على التحدث عن قدرة `talk` ويمكنها إعلان
  `talk.ptt.start` و`talk.ptt.stop` و`talk.ptt.cancel` و`talk.ptt.once`؛
  يسمح Gateway بأوامر الضغط للتحدث هذه افتراضيًا للعقد الموثوقة
  القادرة على التحدث.
- قد يعلّق iOS الصوت في الخلفية؛ تعامل مع ميزات الصوت على أنها أفضل جهد عندما لا يكون التطبيق نشطًا.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: اجلب تطبيق iOS إلى المقدمة (تتطلب أوامر canvas/camera/screen ذلك).
- `A2UI_HOST_NOT_CONFIGURED`: لم يعلن Gateway عنوان URL لسطح Plugin Canvas؛ تحقق من `plugins.entries.canvas.config.host` في [تكوين Gateway](/ar/gateway/configuration).
- لا تظهر مطالبة الاقتران أبدًا: شغّل `openclaw devices list` ووافق يدويًا.
- تفشل إعادة الاتصال بعد إعادة التثبيت: مُسح رمز الاقتران في Keychain؛ أعد إقران العقدة.

## مستندات ذات صلة

- [الاقتران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
