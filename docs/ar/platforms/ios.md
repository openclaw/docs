---
read_when:
    - إقران عقدة iOS أو إعادة توصيلها
    - تشغيل تطبيق iOS من المصدر
    - تصحيح أخطاء اكتشاف Gateway أو أوامر اللوحة
summary: 'تطبيق العقدة على iOS: الاتصال بـ Gateway، والإقران، ولوحة الرسم، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
    generated_at: "2026-07-04T18:02:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

التوفر: تُوزَّع إصدارات تطبيق iPhone عبر قنوات Apple عند تفعيلها لإصدار ما. يمكن أيضًا تشغيل إصدارات التطوير المحلية من المصدر.

## ما يفعله

- يتصل بـ Gateway عبر WebSocket (LAN أو tailnet).
- يوفّر إمكانات Node: اللوحة، لقطة الشاشة، التقاط الكاميرا، الموقع، وضع التحدث، التنبيه الصوتي.
- يتلقى أوامر `node.invoke` ويبلّغ عن أحداث حالة Node.

## المتطلبات

- Gateway يعمل على جهاز آخر (macOS أو Linux أو Windows عبر WSL2).
- مسار الشبكة:
  - LAN نفسه عبر Bonjour، **أو**
  - Tailnet عبر unicast DNS-SD (نطاق مثال: `openclaw.internal.`)، **أو**
  - المضيف/المنفذ يدويًا (احتياطي).

## البدء السريع (الإقران + الاتصال)

1. ابدأ Gateway موثّقًا بمسار يمكن لهاتفك الوصول إليه. يُعد Tailscale
   Serve المسار البعيد الموصى به:

```bash
openclaw gateway --port 18789 --tailscale serve
```

لإعداد موثوق على LAN نفسه، استخدم `gateway.bind: "lan"` موثّقًا
بدلًا من ذلك. ربط loopback الافتراضي لا يمكن الوصول إليه من هاتف. إذا لم
يكن Gateway قد ضُبط بعد، فشغّل `openclaw onboard` أولًا حتى يكون لإنشاء رمز
الإعداد مسار مصادقة برمز مميز أو كلمة مرور.

2. افتح [واجهة التحكم](/ar/web/control-ui)، وحدد **العُقد**، ثم انقر
   **إقران جهاز محمول** في بطاقة **الأجهزة**.

3. في تطبيق iOS، افتح **الإعدادات** → **Gateway**، وامسح رمز QR (أو الصق
   رمز الإعداد)، ثم اتصل.

4. يتصل التطبيق الرسمي تلقائيًا. إذا أظهرت **الأجهزة** طلبًا معلقًا،
   فراجع دوره ونطاقاته قبل الموافقة عليه.

يتطلب زر واجهة التحكم جلسة مقترنة مسبقًا مع `operator.admin`.
وكبديل من الطرفية، اختر Gateway مكتشفًا في تطبيق iOS (أو فعّل
المضيف اليدوي وأدخل المضيف/المنفذ)، ثم وافق على الطلب على مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد التطبيق محاولة الإقران بتفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيُستبدل الطلب المعلق السابق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

اختياري: إذا كانت Node الخاصة بـ iOS تتصل دائمًا من شبكة فرعية محكومة بإحكام، فيمكنك
تفعيل الموافقة التلقائية لأول مرة على Node باستخدام CIDR صريحة أو عناوين IP دقيقة:

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

هذا معطل افتراضيًا. ينطبق فقط على إقران `role: node` جديد
بلا نطاقات مطلوبة. ولا يزال إقران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام يتطلب موافقة يدوية.

5. تحقق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## الدفع المدعوم بالمرحل للإصدارات الرسمية

تستخدم إصدارات iOS الرسمية الموزعة مرحل الدفع الخارجي بدلًا من نشر رمز APNs
الأولي إلى Gateway.

تستخدم إصدارات App Store الرسمية من مسار الإصدار العام المرحل المستضاف على `https://ios-push-relay.openclaw.ai`.

تتطلب عمليات نشر المرحل المخصصة مسار بناء/نشر iOS منفصلًا عن قصد يطابق فيه عنوان URL الخاص بالمرحل عنوان URL الخاص بمرحل Gateway. لا يقبل مسار إصدار App Store العام تجاوزات مخصصة لعنوان URL الخاص بالمرحل. إذا كنت تستخدم بناء مرحل مخصصًا، فاضبط عنوان URL المطابق لمرحل Gateway:

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

كيفية عمل التدفق:

- يسجل تطبيق iOS مع المرحل باستخدام App Attest وStoreKit app transaction JWS.
- يعيد المرحل مقبض مرحل غير شفاف بالإضافة إلى إذن إرسال مقيّد بالتسجيل.
- يجلب تطبيق iOS هوية Gateway المقترن ويضمّنها في تسجيل المرحل، بحيث يُفوَّض التسجيل المدعوم بالمرحل إلى ذلك Gateway المحدد.
- يمرر التطبيق ذلك التسجيل المدعوم بالمرحل إلى Gateway المقترن باستخدام `push.apns.register`.
- يستخدم Gateway مقبض المرحل المخزن هذا من أجل `push.test`، وتنبيهات الاستيقاظ في الخلفية، ونبضات الاستيقاظ.
- يجب أن تطابق عناوين URL المخصصة لمرحل Gateway عنوان URL الخاص بالمرحل المضمن في بناء iOS.
- إذا اتصل التطبيق لاحقًا بـ Gateway مختلف أو ببناء له عنوان URL أساسي مختلف للمرحل، فإنه يحدّث تسجيل المرحل بدلًا من إعادة استخدام الربط القديم.

ما لا يحتاجه Gateway لهذا المسار:

- لا يوجد رمز مرحل على مستوى النشر.
- لا يوجد مفتاح APNs مباشر لعمليات الإرسال الرسمية المدعومة بمرحل App Store.

تدفق المشغّل المتوقع:

1. ثبّت تطبيق iOS الرسمي.
2. اختياري: اضبط `gateway.push.apns.relay.baseUrl` على Gateway فقط عند استخدام بناء مرحل مخصص منفصل عن قصد.
3. أقرن التطبيق بـ Gateway ودعه يُكمل الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائيًا بعد حصوله على رمز APNs، واتصال جلسة المشغّل، ونجاح تسجيل المرحل.
5. بعد ذلك، يمكن لـ `push.test` وتنبيهات إعادة الاتصال ونبضات الاستيقاظ استخدام التسجيل المخزن المدعوم بالمرحل.

## إشارات البقاء في الخلفية

عندما يوقظ iOS التطبيق بسبب دفع صامت أو تحديث في الخلفية أو حدث موقع مهم، يحاول التطبيق
إعادة اتصال قصيرة بـ Node ثم يستدعي `node.event` مع `event: "node.presence.alive"`.
يسجل Gateway ذلك كـ `lastSeenAtMs`/`lastSeenReason` في البيانات الوصفية لـ Node/الجهاز المقترن فقط
بعد معرفة هوية جهاز Node الموثّقة.

يتعامل التطبيق مع تنبيه الخلفية على أنه سُجل بنجاح فقط عندما تتضمن استجابة Gateway
`handled: true`. قد تؤكد Gateways الأقدم `node.event` باستخدام `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحتسب كتحديث دائم لآخر ظهور.

ملاحظة التوافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز مؤقت من env لـ Gateway.
- يرفض مسار إصدار App Store العام `OPENCLAW_PUSH_RELAY_BASE_URL` لبناءات iOS.

## تدفق المصادقة والثقة

يوجد المرحل لفرض قيدين لا يمكن لـ APNs المباشر على Gateway توفيرهما
لبناءات iOS الرسمية:

- لا يمكن استخدام المرحل المستضاف إلا من بناءات iOS أصلية لـ OpenClaw موزعة عبر Apple.
- لا يمكن لـ Gateway إرسال دفعات مدعومة بالمرحل إلا لأجهزة iOS التي اقترنت بذلك
  Gateway المحدد.

من قفزة إلى قفزة:

1. `iOS app -> gateway`
   - يقترن التطبيق أولًا بـ Gateway عبر تدفق مصادقة Gateway العادي.
   - يمنح ذلك التطبيق جلسة Node موثّقة بالإضافة إلى جلسة مشغّل موثّقة.
   - تُستخدم جلسة المشغّل لاستدعاء `gateway.identity.get`.

2. `iOS app -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل المرحل عبر HTTPS.
   - يتضمن التسجيل إثبات App Attest بالإضافة إلى StoreKit app transaction JWS.
   - يتحقق المرحل من bundle ID، وإثبات App Attest، وإثبات توزيع Apple، ويتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - هذا ما يمنع بناءات Xcode/التطوير المحلية من استخدام المرحل المستضاف. قد يكون البناء المحلي
     موقّعًا، لكنه لا يفي بإثبات توزيع Apple الرسمي الذي يتوقعه المرحل.

3. `gateway identity delegation`
   - قبل تسجيل المرحل، يجلب التطبيق هوية Gateway المقترن من
     `gateway.identity.get`.
   - يضمّن التطبيق هوية Gateway تلك في حمولة تسجيل المرحل.
   - يعيد المرحل مقبض مرحل وإذن إرسال مقيّدًا بالتسجيل ومفوّضين إلى
     هوية Gateway تلك.

4. `gateway -> relay`
   - يخزن Gateway مقبض المرحل وإذن الإرسال من `push.apns.register`.
   - عند `push.test`، وتنبيهات إعادة الاتصال، ونبضات الاستيقاظ، يوقّع Gateway طلب الإرسال بهوية
     جهازه الخاصة.
   - يتحقق المرحل من كل من إذن الإرسال المخزن وتوقيع Gateway مقابل هوية
     Gateway المفوضة من التسجيل.
   - لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن، حتى لو حصل بطريقة ما على المقبض.

5. `relay -> APNs`
   - يملك المرحل بيانات اعتماد APNs الإنتاجية ورمز APNs الأولي للبناء الرسمي.
   - لا يخزن Gateway أبدًا رمز APNs الأولي للبناءات الرسمية المدعومة بالمرحل.
   - يرسل المرحل الدفع النهائي إلى APNs نيابةً عن Gateway المقترن.

سبب إنشاء هذا التصميم:

- لإبقاء بيانات اعتماد APNs الإنتاجية خارج Gateways المستخدمين.
- لتجنب تخزين رموز APNs الأولية للبناء الرسمي على Gateway.
- للسماح باستخدام المرحل المستضاف فقط لبناءات iOS الرسمية من OpenClaw.
- لمنع Gateway واحد من إرسال دفعات استيقاظ إلى أجهزة iOS مملوكة لـ Gateway مختلف.

تبقى البناءات المحلية/اليدوية على APNs المباشر. إذا كنت تختبر تلك البناءات دون المرحل، فسيظل
Gateway بحاجة إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات env وقت التشغيل على مضيف Gateway، وليست إعدادات Fastlane. لا يخزن `apps/ios/fastlane/.env` إلا
مصادقة App Store Connect مثل `APP_STORE_CONNECT_KEY_ID` و
`APP_STORE_CONNECT_ISSUER_ID`؛ ولا يضبط تسليم APNs المباشر لبناءات iOS المحلية.

تخزين مضيف Gateway الموصى به:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تلتزم بملف `.p8` ولا تضعه ضمن checkout المستودع.

## مسارات الاكتشاف

### Bonjour (LAN)

يتصفح تطبيق iOS خدمة `_openclaw-gw._tcp` على `local.`، وعند الضبط، نطاق اكتشاف
DNS-SD واسع النطاق نفسه. تظهر Gateways الموجودة على LAN نفسه تلقائيًا من `local.`؛
ويمكن للاكتشاف عبر الشبكات استخدام النطاق واسع النطاق المضبوط دون تغيير نوع الإشارة.

### Tailnet (عبر الشبكات)

إذا كان mDNS محظورًا، فاستخدم منطقة unicast DNS-SD (اختر نطاقًا؛ مثال:
`openclaw.internal.`) وTailscale split DNS.
راجع [Bonjour](/ar/gateway/bonjour) للحصول على مثال CoreDNS.

### المضيف/المنفذ اليدوي

في الإعدادات، فعّل **المضيف اليدوي** وأدخل مضيف Gateway + المنفذ (الافتراضي `18789`).

## اللوحة + A2UI

تعرض Node الخاصة بـ iOS لوحة WKWebView. استخدم `node.invoke` للتحكم بها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يستضيف مضيف لوحة Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- يُقدَّم من خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`، الافتراضي `18789`).
- تُبقي Node الخاصة بـ iOS السقالة المدمجة كالعرض الافتراضي المتصل. يستخدم `canvas.a2ui.push` و`canvas.a2ui.reset` صفحة A2UI المجمعة والمملوكة للتطبيق.
- صفحات A2UI البعيدة الخاصة بـ Gateway للعرض فقط على iOS؛ ولا تُقبل إجراءات أزرار A2UI الأصلية إلا من الصفحات المجمعة والمملوكة للتطبيق.
- عُد إلى السقالة المدمجة باستخدام `canvas.navigate` و`{"url":""}`.

## العلاقة مع Computer Use

تطبيق iOS هو سطح Node محمول، وليس خلفية Codex Computer Use. يتحكم Codex
Computer Use و`cua-driver mcp` بسطح مكتب macOS محلي عبر أدوات MCP؛ ويعرّض تطبيق iOS إمكانات iPhone عبر أوامر Node في OpenClaw
مثل `canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

لا يزال بإمكان الوكلاء تشغيل تطبيق iOS عبر OpenClaw باستدعاء أوامر Node،
لكن تلك الاستدعاءات تمر عبر بروتوكول Node في Gateway وتتبع حدود iOS
في المقدمة/الخلفية. استخدم [Codex Computer Use](/ar/plugins/codex-computer-use)
للتحكم بسطح المكتب المحلي وهذه الصفحة لإمكانات Node على iOS.

### تقييم اللوحة / اللقطة

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## التنبيه الصوتي + وضع التحدث

- يتوفر تنبيهات الاستيقاظ الصوتي ووضع التحدث في الإعدادات.
- يستخدم التحدث الفوري من OpenAI بروتوكول WebRTC المملوك للعميل عندما تكون قيمة `talk.realtime.transport` هي `webrtc`؛ وتظل تهيئة `gateway-relay` الصريحة مملوكة لـ Gateway. راجع [وضع التحدث](/ar/nodes/talk).
- تعلن عُقد iOS القادرة على التحدث عن إمكانية `talk` ويمكنها التصريح بـ
  `talk.ptt.start` و`talk.ptt.stop` و`talk.ptt.cancel` و`talk.ptt.once`؛
  يسمح Gateway بأوامر اضغط للتحدث هذه افتراضيًا للعُقد الموثوقة
  القادرة على التحدث.
- قد يعلّق iOS الصوت في الخلفية؛ تعامل مع ميزات الصوت على أنها تعمل بأفضل جهد عندما لا يكون التطبيق نشطًا.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: انقل تطبيق iOS إلى المقدمة (تتطلب أوامر اللوحة/الكاميرا/الشاشة ذلك).
- `A2UI_HOST_UNAVAILABLE`: تعذر الوصول إلى صفحة A2UI المضمّنة في WebView داخل التطبيق؛ أبقِ التطبيق في المقدمة على علامة تبويب الشاشة ثم أعد المحاولة.
- لا تظهر مطالبة الاقتران أبدًا: شغّل `openclaw devices list` ووافق يدويًا.
- تفشل إعادة الاتصال بعد إعادة التثبيت: تم مسح رمز اقتران Keychain؛ أعد إقران العُقدة.

## المستندات ذات الصلة

- [الاقتران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
