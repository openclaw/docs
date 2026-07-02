---
read_when:
    - إقران عقدة iOS أو إعادة توصيلها
    - تشغيل تطبيق iOS من المصدر
    - تصحيح أخطاء اكتشاف Gateway أو أوامر اللوحة
summary: 'تطبيق عقدة iOS: الاتصال بـ Gateway، والإقران، واللوحة، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
    generated_at: "2026-07-02T22:34:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

التوفر: تُوزَّع إصدارات تطبيق iPhone عبر قنوات Apple عند تفعيلها لإصدار ما. ويمكن أيضاً تشغيل إصدارات التطوير المحلية من المصدر.

## ما يفعله

- يتصل بـ Gateway عبر WebSocket (شبكة LAN أو tailnet).
- يكشف إمكانات العقدة: Canvas، ولقطة Screen، والتقاط Camera، وLocation، ووضع Talk، وإيقاظ Voice.
- يتلقى أوامر `node.invoke` ويبلّغ عن أحداث حالة العقدة.

## المتطلبات

- Gateway يعمل على جهاز آخر (macOS أو Linux أو Windows عبر WSL2).
- مسار شبكة:
  - شبكة LAN نفسها عبر Bonjour، **أو**
  - Tailnet عبر unicast DNS-SD (نطاق مثال: `openclaw.internal.`)، **أو**
  - مضيف/منفذ يدوي (احتياطي).

## البدء السريع (الاقتران + الاتصال)

1. ابدأ Gateway:

```bash
openclaw gateway --port 18789
```

2. في تطبيق iOS، افتح Settings واختر gateway مكتشفاً (أو فعّل Manual Host وأدخل المضيف/المنفذ).

3. وافق على طلب الاقتران على مضيف gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد التطبيق محاولة الاقتران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيُستبدل الطلب السابق المعلّق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

اختياري: إذا كانت عقدة iOS تتصل دائماً من شبكة فرعية محكومة بإحكام، يمكنك
تفعيل الموافقة التلقائية لأول مرة على العقدة باستخدام CIDRs صريحة أو عناوين IP دقيقة:

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

هذا معطّل افتراضياً. ينطبق فقط على اقتران `role: node` جديد
دون نطاقات مطلوبة. لا يزال اقتران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام يتطلب موافقة يدوية.

4. تحقق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## الدفع المدعوم بالمرحل للإصدارات الرسمية

تستخدم إصدارات iOS الرسمية الموزعة مرحل الدفع الخارجي بدلاً من نشر رمز APNs الخام
إلى gateway.

تستخدم إصدارات App Store الرسمية من مسار الإصدار العام المرحل المستضاف على `https://ios-push-relay.openclaw.ai`.

تتطلب عمليات نشر المرحل المخصصة مسار بناء/نشر iOS منفصلاً عمداً يكون عنوان URL للمرحل فيه مطابقاً لعنوان URL لمرحل gateway. لا يقبل مسار إصدار App Store العام تجاوزات مخصصة لعنوان URL للمرحل. إذا كنت تستخدم بناء مرحل مخصصاً، فعيّن عنوان URL المطابق لمرحل gateway:

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
- يعيد المرحل مقبض مرحل معتماً بالإضافة إلى منحة إرسال محددة بنطاق التسجيل.
- يجلب تطبيق iOS هوية gateway المقترن ويضمنها في تسجيل المرحل، لذلك يُفوَّض التسجيل المدعوم بالمرحل إلى ذلك gateway المحدد.
- يمرر التطبيق ذلك التسجيل المدعوم بالمرحل إلى gateway المقترن عبر `push.apns.register`.
- يستخدم gateway مقبض المرحل المخزن هذا من أجل `push.test`، والإيقاظات الخلفية، وتنبيهات الإيقاظ.
- يجب أن تطابق عناوين URL لمرحل gateway المخصصة عنوان URL للمرحل المضمّن في بناء iOS.
- إذا اتصل التطبيق لاحقاً بـ gateway مختلف أو ببناء له عنوان URL أساسي مختلف للمرحل، فإنه يحدّث تسجيل المرحل بدلاً من إعادة استخدام الربط القديم.

ما لا يحتاجه gateway لهذا المسار:

- لا يوجد رمز مرحل على مستوى النشر.
- لا يوجد مفتاح APNs مباشر للإرسالات الرسمية المدعومة بمرحل App Store.

تدفق المشغّل المتوقع:

1. ثبّت تطبيق iOS الرسمي.
2. اختياري: عيّن `gateway.push.apns.relay.baseUrl` على gateway فقط عند استخدام بناء مرحل مخصص منفصل عمداً.
3. اقرن التطبيق بـ gateway ودعه ينهي الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائياً بعد حصوله على رمز APNs، واتصال جلسة المشغّل، ونجاح تسجيل المرحل.
5. بعد ذلك، يمكن أن تستخدم `push.test` وإيقاظات إعادة الاتصال وتنبيهات الإيقاظ التسجيل المخزن المدعوم بالمرحل.

## إشارات البقاء في الخلفية

عندما يوقظ iOS التطبيق لدفع صامت أو تحديث خلفي أو حدث موقع مهم، يحاول التطبيق
إعادة اتصال قصيرة للعقدة ثم يستدعي `node.event` مع `event: "node.presence.alive"`.
يسجل gateway ذلك كـ `lastSeenAtMs`/`lastSeenReason` على البيانات الوصفية للعقدة/الجهاز المقترن فقط
بعد معرفة هوية جهاز العقدة المصادق عليها.

يعامل التطبيق الإيقاظ الخلفي على أنه سُجل بنجاح فقط عندما تتضمن استجابة gateway
`handled: true`. قد تقر gateways الأقدم `node.event` باستخدام `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحتسب كتحديث دائم لآخر مشاهدة.

ملاحظة التوافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز بيئي مؤقت لـ gateway.
- يرفض مسار إصدار App Store العام `OPENCLAW_PUSH_RELAY_BASE_URL` لبناءات iOS.

## المصادقة وتدفق الثقة

يوجد المرحل لفرض قيدين لا يستطيع APNs المباشر على gateway توفيرهما
لإصدارات iOS الرسمية:

- يمكن فقط لبناءات iOS الأصلية من OpenClaw الموزعة عبر Apple استخدام المرحل المستضاف.
- يستطيع gateway إرسال دفعات مدعومة بالمرحل فقط لأجهزة iOS التي اقترنت بذلك
  gateway المحدد.

قفزة بقفزة:

1. `iOS app -> gateway`
   - يقترن التطبيق أولاً بـ gateway عبر تدفق مصادقة Gateway العادي.
   - يمنح ذلك التطبيق جلسة عقدة مصادقاً عليها بالإضافة إلى جلسة مشغّل مصادق عليها.
   - تُستخدم جلسة المشغّل لاستدعاء `gateway.identity.get`.

2. `iOS app -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل المرحل عبر HTTPS.
   - يتضمن التسجيل إثبات App Attest بالإضافة إلى StoreKit app transaction JWS.
   - يتحقق المرحل من معرف الحزمة وإثبات App Attest وإثبات توزيع Apple، ويتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - هذا هو ما يمنع بناءات Xcode/dev المحلية من استخدام المرحل المستضاف. قد يكون البناء المحلي
     موقّعاً، لكنه لا يستوفي إثبات توزيع Apple الرسمي الذي يتوقعه المرحل.

3. `gateway identity delegation`
   - قبل تسجيل المرحل، يجلب التطبيق هوية gateway المقترن من
     `gateway.identity.get`.
   - يضمن التطبيق هوية gateway تلك في حمولة تسجيل المرحل.
   - يعيد المرحل مقبض مرحل ومنحة إرسال محددة بنطاق التسجيل ومفوّضة إلى
     هوية gateway تلك.

4. `gateway -> relay`
   - يخزن gateway مقبض المرحل ومنحة الإرسال من `push.apns.register`.
   - عند `push.test` وإيقاظات إعادة الاتصال وتنبيهات الإيقاظ، يوقّع gateway طلب الإرسال بهوية
     جهازه الخاصة.
   - يتحقق المرحل من كل من منحة الإرسال المخزنة وتوقيع gateway مقابل هوية
     gateway المفوّضة من التسجيل.
   - لا يستطيع gateway آخر إعادة استخدام ذلك التسجيل المخزن، حتى لو حصل بطريقة ما على المقبض.

5. `relay -> APNs`
   - يمتلك المرحل بيانات اعتماد APNs الإنتاجية ورمز APNs الخام للبناء الرسمي.
   - لا يخزن gateway أبداً رمز APNs الخام للبناءات الرسمية المدعومة بالمرحل.
   - يرسل المرحل الدفع النهائي إلى APNs نيابة عن gateway المقترن.

لماذا أُنشئ هذا التصميم:

- لإبقاء بيانات اعتماد APNs الإنتاجية خارج gateways المستخدمين.
- لتجنب تخزين رموز APNs الخام للبناء الرسمي على gateway.
- للسماح باستخدام المرحل المستضاف فقط لبناءات iOS الرسمية من OpenClaw.
- لمنع gateway واحد من إرسال دفعات إيقاظ إلى أجهزة iOS مملوكة لـ gateway مختلف.

تبقى البناءات المحلية/اليدوية على APNs المباشر. إذا كنت تختبر هذه البناءات دون المرحل، فلا يزال
gateway يحتاج إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات بيئة وقت تشغيل لمضيف gateway، وليست إعدادات Fastlane. يخزن `apps/ios/fastlane/.env` فقط
مصادقة App Store Connect مثل `APP_STORE_CONNECT_KEY_ID` و
`APP_STORE_CONNECT_ISSUER_ID`؛ ولا يهيئ تسليم APNs المباشر لبناءات iOS المحلية.

تخزين مضيف gateway الموصى به:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تلتزم بملف `.p8` أو تضعه ضمن نسخة عمل المستودع.

## مسارات الاكتشاف

### Bonjour (LAN)

يتصفح تطبيق iOS ‏`_openclaw-gw._tcp` على `local.`، وعند التهيئة، نطاق اكتشاف DNS-SD واسع النطاق نفسه. تظهر gateways على شبكة LAN نفسها تلقائياً من `local.`؛
يمكن للاكتشاف عبر الشبكات استخدام النطاق واسع النطاق المهيأ دون تغيير نوع الإشارة.

### Tailnet (عبر الشبكات)

إذا كان mDNS محظوراً، فاستخدم منطقة unicast DNS-SD (اختر نطاقاً؛ مثال:
`openclaw.internal.`) وTailscale split DNS.
راجع [Bonjour](/ar/gateway/bonjour) لمثال CoreDNS.

### المضيف/المنفذ اليدوي

في Settings، فعّل **Manual Host** وأدخل مضيف gateway + المنفذ (الافتراضي `18789`).

## Canvas + A2UI

تعرض عقدة iOS لوحة WKWebView. استخدم `node.invoke` لقيادتها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يقدّم مضيف Canvas في Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- يُقدَّم من خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`، الافتراضي `18789`).
- تحتفظ عقدة iOS بالهيكل المدمج كعرض افتراضي متصل. يستخدم `canvas.a2ui.push` و`canvas.a2ui.reset` صفحة A2UI المجمعة المملوكة للتطبيق.
- صفحات A2UI البعيدة من Gateway للعرض فقط على iOS؛ تُقبل إجراءات أزرار A2UI الأصلية فقط من الصفحات المجمعة المملوكة للتطبيق.
- عُد إلى الهيكل المدمج باستخدام `canvas.navigate` و`{"url":""}`.

## علاقة Computer Use

تطبيق iOS هو سطح عقدة محمول، وليس خلفية Codex Computer Use. يتحكم Codex
Computer Use و`cua-driver mcp` في سطح مكتب macOS محلي عبر أدوات MCP؛
يكشف تطبيق iOS إمكانات iPhone عبر أوامر عقد OpenClaw
مثل `canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

لا يزال بإمكان الوكلاء تشغيل تطبيق iOS عبر OpenClaw من خلال استدعاء أوامر
العقدة، لكن هذه الاستدعاءات تمر عبر بروتوكول عقدة gateway وتتبع حدود iOS
في المقدمة/الخلفية. استخدم [Codex Computer Use](/ar/plugins/codex-computer-use)
للتحكم بسطح المكتب المحلي وهذه الصفحة لإمكانات عقدة iOS.

### تقييم Canvas / لقطة

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## إيقاظ Voice + وضع Talk

- يتوفر إيقاظ Voice ووضع Talk في Settings.
- يستخدم OpenAI realtime Talk ‏WebRTC المملوك للعميل عندما يكون `talk.realtime.transport` هو `webrtc`؛ وتبقى تهيئة `gateway-relay` الصريحة مملوكة لـ Gateway. راجع [وضع Talk](/ar/nodes/talk).
- تعلن عقد iOS القادرة على Talk عن إمكانية `talk` ويمكنها إعلان
  `talk.ptt.start` و`talk.ptt.stop` و`talk.ptt.cancel` و`talk.ptt.once`؛
  يسمح Gateway بأوامر الضغط للتحدث هذه افتراضياً للعقد الموثوقة
  القادرة على Talk.
- قد يعلّق iOS الصوت في الخلفية؛ تعامل مع ميزات الصوت على أنها best-effort عندما لا يكون التطبيق نشطاً.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: اجلب تطبيق iOS إلى المقدمة (تتطلب أوامر canvas/camera/screen ذلك).
- `A2UI_HOST_UNAVAILABLE`: لم تكن صفحة A2UI المجمعة قابلة للوصول في WebView التطبيق؛ أبقِ التطبيق في المقدمة على علامة تبويب Screen وأعد المحاولة.
- لا تظهر مطالبة الاقتران أبداً: شغّل `openclaw devices list` ووافق يدوياً.
- تفشل إعادة الاتصال بعد إعادة التثبيت: مُسح رمز اقتران Keychain؛ أعد اقتران العقدة.

## مستندات ذات صلة

- [الاقتران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
