---
read_when:
    - إقران عقدة iOS أو إعادة توصيلها
    - تشغيل تطبيق iOS من المصدر
    - تصحيح أخطاء اكتشاف Gateway أو أوامر اللوحة
summary: 'تطبيق عقدة iOS: الاتصال بـ Gateway، والاقتران، واللوحة، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
    generated_at: "2026-06-27T17:57:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

التوفر: تُوزَّع إصدارات تطبيق iPhone عبر قنوات Apple عند تمكينها لإصدار ما. ويمكن أيضًا تشغيل إصدارات التطوير المحلية من المصدر.

## ما يفعله

- يتصل بـ Gateway عبر WebSocket (شبكة LAN أو tailnet).
- يوفّر قدرات العقدة: لوحة الرسم، لقطة الشاشة، التقاط الكاميرا، الموقع، وضع التحدث، التنبيه الصوتي.
- يتلقى أوامر `node.invoke` ويبلّغ عن أحداث حالة العقدة.

## المتطلبات

- Gateway يعمل على جهاز آخر (macOS أو Linux أو Windows عبر WSL2).
- مسار شبكة:
  - شبكة LAN نفسها عبر Bonjour، **أو**
  - Tailnet عبر unicast DNS-SD (نطاق مثال: `openclaw.internal.`)، **أو**
  - المضيف/المنفذ يدويًا (خيار احتياطي).

## البدء السريع (الإقران + الاتصال)

1. ابدأ تشغيل Gateway:

```bash
openclaw gateway --port 18789
```

2. في تطبيق iOS، افتح الإعدادات واختر بوابة مكتشفة (أو فعّل المضيف اليدوي وأدخل المضيف/المنفذ).

3. وافق على طلب الإقران على مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد التطبيق محاولة الإقران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيُستبدل الطلب المعلق السابق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

اختياري: إذا كانت عقدة iOS تتصل دائمًا من شبكة فرعية محكمة التحكم، يمكنك
الاشتراك في الموافقة التلقائية على العقدة لأول مرة باستخدام CIDR صريحة أو عناوين IP دقيقة:

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
بدون نطاقات مطلوبة. لا يزال إقران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام يتطلب موافقة يدوية.

4. تحقق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## الدفع المدعوم بالمرحل للإصدارات الرسمية

تستخدم إصدارات iOS الرسمية الموزعة مرحل الدفع الخارجي بدلًا من نشر رمز APNs
الخام إلى Gateway.

تستخدم الإصدارات الرسمية/TestFlight من مسار إصدار App Store العام المرحل المستضاف على `https://ios-push-relay.openclaw.ai`.

تتطلب عمليات نشر المرحل المخصص مسار بناء/نشر iOS منفصلًا عمدًا يطابق عنوان URL الخاص بالمرحل فيه عنوان URL لمرحل Gateway. لا يقبل مسار إصدار App Store العام تجاوزات عنوان URL لمرحل مخصص. إذا كنت تستخدم بناء مرحل مخصصًا، فاضبط عنوان URL المطابق لمرحل Gateway:

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

- يسجل تطبيق iOS لدى المرحل باستخدام App Attest وStoreKit app transaction JWS.
- يعيد المرحل مقبض مرحل مبهمًا مع منحة إرسال محددة بنطاق التسجيل.
- يجلب تطبيق iOS هوية Gateway المقترن ويضمّنها في تسجيل المرحل، بحيث يُفوّض التسجيل المدعوم بالمرحل إلى ذلك Gateway المحدد.
- يمرر التطبيق ذلك التسجيل المدعوم بالمرحل إلى Gateway المقترن باستخدام `push.apns.register`.
- يستخدم Gateway مقبض المرحل المخزّن هذا من أجل `push.test`، وتنبيهات الاستيقاظ في الخلفية، ودفقات الاستيقاظ.
- يجب أن تطابق عناوين URL لمرحل Gateway المخصصة عنوان URL للمرحل المضمّن في بناء iOS.
- إذا اتصل التطبيق لاحقًا بـ Gateway مختلف أو ببناء له عنوان URL أساسي مختلف للمرحل، فإنه يحدّث تسجيل المرحل بدلًا من إعادة استخدام الربط القديم.

ما لا يحتاج إليه Gateway لهذا المسار:

- لا رمز مرحل على مستوى النشر.
- لا مفتاح APNs مباشرًا للإرسالات الرسمية/TestFlight المدعومة بالمرحل.

تدفق المشغّل المتوقع:

1. ثبّت بناء iOS الرسمي/TestFlight.
2. اختياري: اضبط `gateway.push.apns.relay.baseUrl` على Gateway فقط عند استخدام بناء مرحل مخصص منفصل عمدًا.
3. أقرن التطبيق بـ Gateway واتركه يكمل الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائيًا بعد أن يحصل على رمز APNs، وتتصل جلسة المشغّل، وينجح تسجيل المرحل.
5. بعد ذلك، يمكن أن تستخدم `push.test`، وتنبيهات إعادة الاتصال، ودفقات الاستيقاظ التسجيل المخزّن المدعوم بالمرحل.

## إشارات البقاء حية في الخلفية

عندما يوقظ iOS التطبيق بسبب دفع صامت أو تحديث في الخلفية أو حدث موقع مهم، يحاول التطبيق
إعادة اتصال قصيرة للعقدة ثم يستدعي `node.event` مع `event: "node.presence.alive"`.
يسجل Gateway هذا باعتباره `lastSeenAtMs`/`lastSeenReason` في البيانات الوصفية للعقدة/الجهاز المقترن فقط
بعد أن تُعرف هوية جهاز العقدة المصادقة.

يعامل التطبيق استيقاظ الخلفية على أنه سُجل بنجاح فقط عندما تتضمن استجابة Gateway
`handled: true`. قد تقر Gateways الأقدم `node.event` باستخدام `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحتسب كتحديث دائم لآخر مشاهدة.

ملاحظة التوافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز مؤقت عبر env لـ Gateway.
- يرفض مسار إصدار App Store العام `OPENCLAW_PUSH_RELAY_BASE_URL` لبناءات iOS.

## تدفق المصادقة والثقة

يوجد المرحل لفرض قيدين لا يستطيع APNs المباشر على Gateway توفيرهما
لبناءات iOS الرسمية:

- لا يمكن استخدام المرحل المستضاف إلا من بناءات iOS أصلية لـ OpenClaw وموزعة عبر Apple.
- يستطيع Gateway إرسال دفعات مدعومة بالمرحل فقط لأجهزة iOS التي اقترنت بذلك
  Gateway المحدد.

قفزة بعد قفزة:

1. `iOS app -> gateway`
   - يقترن التطبيق أولًا بـ Gateway عبر تدفق مصادقة Gateway العادي.
   - يمنح ذلك التطبيق جلسة عقدة مصادقة بالإضافة إلى جلسة مشغّل مصادقة.
   - تُستخدم جلسة المشغّل لاستدعاء `gateway.identity.get`.

2. `iOS app -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل المرحل عبر HTTPS.
   - يتضمن التسجيل إثبات App Attest بالإضافة إلى StoreKit app transaction JWS.
   - يتحقق المرحل من معرّف الحزمة، وإثبات App Attest، وإثبات توزيع Apple، ويتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - هذا ما يمنع بناءات Xcode/التطوير المحلية من استخدام المرحل المستضاف. قد يكون البناء المحلي
     موقّعًا، لكنه لا يفي بإثبات توزيع Apple الرسمي الذي يتوقعه المرحل.

3. `gateway identity delegation`
   - قبل تسجيل المرحل، يجلب التطبيق هوية Gateway المقترن من
     `gateway.identity.get`.
   - يضمّن التطبيق هوية Gateway تلك في حمولة تسجيل المرحل.
   - يعيد المرحل مقبض مرحل ومنحة إرسال محددة بنطاق التسجيل مفوضين إلى
     هوية Gateway تلك.

4. `gateway -> relay`
   - يخزن Gateway مقبض المرحل ومنحة الإرسال من `push.apns.register`.
   - عند `push.test`، وتنبيهات إعادة الاتصال، ودفقات الاستيقاظ، يوقّع Gateway طلب الإرسال باستخدام
     هوية جهازه الخاصة.
   - يتحقق المرحل من كل من منحة الإرسال المخزنة وتوقيع Gateway مقابل هوية
     Gateway المفوضة من التسجيل.
   - لا يستطيع Gateway آخر إعادة استخدام ذلك التسجيل المخزّن، حتى لو حصل على المقبض بطريقة ما.

5. `relay -> APNs`
   - يملك المرحل بيانات اعتماد APNs الإنتاجية ورمز APNs الخام للبناء الرسمي.
   - لا يخزن Gateway رمز APNs الخام مطلقًا للبناءات الرسمية المدعومة بالمرحل.
   - يرسل المرحل الدفع النهائي إلى APNs نيابة عن Gateway المقترن.

لماذا أُنشئ هذا التصميم:

- لإبقاء بيانات اعتماد APNs الإنتاجية خارج Gateways الخاصة بالمستخدمين.
- لتجنب تخزين رموز APNs الخام للبناء الرسمي على Gateway.
- للسماح باستخدام المرحل المستضاف فقط لبناءات OpenClaw الرسمية/TestFlight.
- لمنع Gateway واحد من إرسال دفعات إيقاظ إلى أجهزة iOS يملكها Gateway مختلف.

تبقى البناءات المحلية/اليدوية على APNs المباشر. إذا كنت تختبر تلك البناءات بدون المرحل، فلا يزال
Gateway يحتاج إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات env لوقت تشغيل مضيف Gateway، وليست إعدادات Fastlane. يخزن `apps/ios/fastlane/.env` فقط
مصادقة App Store Connect / TestFlight مثل `APP_STORE_CONNECT_KEY_ID` و
`APP_STORE_CONNECT_ISSUER_ID`؛ ولا يهيئ تسليم APNs المباشر لبناءات iOS المحلية.

تخزين مضيف Gateway الموصى به:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تثبت ملف `.p8` أو تضعه داخل نسخة العمل من المستودع.

## مسارات الاكتشاف

### Bonjour (LAN)

يتصفح تطبيق iOS `_openclaw-gw._tcp` على `local.`، وعند التهيئة، نطاق اكتشاف
DNS-SD واسع النطاق نفسه. تظهر Gateways على شبكة LAN نفسها تلقائيًا من `local.`؛
ويمكن للاكتشاف عبر الشبكات استخدام النطاق واسع النطاق المهيأ بدون تغيير نوع المنارة.

### Tailnet (عبر الشبكات)

إذا كان mDNS محظورًا، فاستخدم منطقة unicast DNS-SD (اختر نطاقًا؛ مثال:
`openclaw.internal.`) وTailscale split DNS.
راجع [Bonjour](/ar/gateway/bonjour) للاطلاع على مثال CoreDNS.

### المضيف/المنفذ اليدوي

في الإعدادات، فعّل **المضيف اليدوي** وأدخل مضيف Gateway + المنفذ (الافتراضي `18789`).

## Canvas + A2UI

تعرض عقدة iOS لوحة رسم WKWebView. استخدم `node.invoke` للتحكم بها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يقدّم مضيف لوحة الرسم في Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- يُقدَّم من خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`، الافتراضي `18789`).
- تُبقي عقدة iOS السقالة المدمجة كطريقة العرض الافتراضية المتصلة. يستخدم `canvas.a2ui.push` و`canvas.a2ui.reset` صفحة A2UI المجمعة المملوكة للتطبيق.
- صفحات A2UI البعيدة لـ Gateway للعرض فقط على iOS؛ ولا تُقبل إجراءات أزرار A2UI الأصلية إلا من الصفحات المجمعة المملوكة للتطبيق.
- عُد إلى السقالة المدمجة باستخدام `canvas.navigate` و`{"url":""}`.

## العلاقة مع Computer Use

تطبيق iOS هو سطح عقدة جوال، وليس خلفية Codex Computer Use. يتحكم Codex
Computer Use و`cua-driver mcp` في سطح مكتب macOS محلي عبر أدوات MCP؛
ويكشف تطبيق iOS قدرات iPhone عبر أوامر عقد OpenClaw
مثل `canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

لا يزال بإمكان الوكلاء تشغيل تطبيق iOS عبر OpenClaw من خلال استدعاء أوامر
العقدة، لكن هذه الاستدعاءات تمر عبر بروتوكول عقدة Gateway وتتبع حدود
iOS في المقدمة/الخلفية. استخدم [Codex Computer Use](/ar/plugins/codex-computer-use)
للتحكم في سطح المكتب المحلي، وهذه الصفحة لقدرات عقد iOS.

### تقييم Canvas / لقطة

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## التنبيه الصوتي + وضع التحدث

- التنبيه الصوتي ووضع التحدث متاحان في الإعدادات.
- تعلن عقد iOS القادرة على التحدث عن قدرة `talk` ويمكنها التصريح عن
  `talk.ptt.start` و`talk.ptt.stop` و`talk.ptt.cancel` و`talk.ptt.once`؛
  ويسمح Gateway بأوامر الضغط للتحدث هذه افتراضيًا للعقد الموثوقة
  القادرة على التحدث.
- قد يعلّق iOS الصوت في الخلفية؛ تعامل مع ميزات الصوت على أنها أفضل جهد عندما لا يكون التطبيق نشطًا.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: اجلب تطبيق iOS إلى المقدمة (تتطلب أوامر لوحة الرسم/الكاميرا/الشاشة ذلك).
- `A2UI_HOST_UNAVAILABLE`: لم تكن صفحة A2UI المجمعة قابلة للوصول في WebView الخاص بالتطبيق؛ أبقِ التطبيق في المقدمة على تبويب الشاشة وأعد المحاولة.
- لا تظهر مطالبة الإقران مطلقًا: شغّل `openclaw devices list` ووافق يدويًا.
- تفشل إعادة الاتصال بعد إعادة التثبيت: مُسح رمز إقران Keychain؛ أعد إقران العقدة.

## المستندات ذات الصلة

- [الإقران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
