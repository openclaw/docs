---
read_when:
    - اقتران Node على iOS أو إعادة اتصاله
    - تشغيل تطبيق iOS من المصدر
    - تصحيح اكتشاف Gateway أو أوامر canvas
summary: 'تطبيق Node على iOS: الاتصال بـ Gateway، والاقتران، وcanvas، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:51:44Z"
  model: gpt-5.4
  provider: openai
  source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
  source_path: platforms/ios.md
  workflow: 15
---

التوفر: معاينة داخلية. تطبيق iOS غير موزع علنًا بعد.

## ما الذي يفعله

- يتصل بـ Gateway عبر WebSocket ‏(LAN أو tailnet).
- يكشف إمكانات Node: ‏Canvas، ولقطة شاشة، والتقاط الكاميرا، والموقع، ووضع Talk، والتنبيه الصوتي.
- يتلقى أوامر `node.invoke` ويبلّغ عن أحداث حالة Node.

## المتطلبات

- Gateway يعمل على جهاز آخر (macOS أو Linux أو Windows عبر WSL2).
- مسار شبكة:
  - LAN نفسها عبر Bonjour، **أو**
  - tailnet عبر unicast DNS-SD ‏(مثال على النطاق: `openclaw.internal.`)، **أو**
  - مضيف/منفذ يدويًا (كبديل).

## البدء السريع (الاقتران + الاتصال)

1. شغّل Gateway:

```bash
openclaw gateway --port 18789
```

2. في تطبيق iOS، افتح Settings واختر Gateway مكتشفًا (أو فعّل Manual Host وأدخل المضيف/المنفذ).

3. وافق على طلب الاقتران على مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد التطبيق محاولة الاقتران مع تغيّر تفاصيل المصادقة (الدور/النطاقات/المفتاح العام)،
فسيتم استبدال الطلب المعلق السابق وإنشاء `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

اختياري: إذا كانت Node على iOS تتصل دائمًا من شبكة فرعية محكمة التحكم، فيمكنك
تفعيل الموافقة التلقائية لأول اقتران Node باستخدام CIDR أو عناوين IP مطابقة تمامًا:

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

يكون هذا معطلًا افتراضيًا. وينطبق فقط على اقتران `role: node` الجديد الذي لا يحتوي
على نطاقات مطلوبة. وما زال اقتران operator/browser وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام يتطلب موافقة يدوية.

4. تحقق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push مدعوم بمرحل للإصدارات الرسمية

تستخدم إصدارات iOS الرسمية الموزعة المرحل الخارجي للدفع بدلًا من نشر رمز APNs الخام
إلى Gateway.

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

- يسجل تطبيق iOS مع المرحل باستخدام App Attest وإيصال التطبيق.
- يعيد المرحل handle مرحل معتمًا بالإضافة إلى منحة إرسال ضمن نطاق التسجيل.
- يجلب تطبيق iOS هوية Gateway المقترن ويضمّنها في تسجيل المرحل، بحيث يُفوَّض التسجيل المدعوم بالمرحل إلى ذلك Gateway المحدد.
- يمرر التطبيق هذا التسجيل المدعوم بالمرحل إلى Gateway المقترن باستخدام `push.apns.register`.
- يستخدم Gateway ذلك الـ handle المخزن للـ `push.test` والتنبيهات الخلفية والتنبيهات التحفيزية للاستيقاظ.
- يجب أن يطابق عنوان القاعدة الخاص بمرحل Gateway عنوان المرحل المضمّن في إصدار iOS الرسمي/TestFlight.
- إذا اتصل التطبيق لاحقًا بـ Gateway مختلف أو بإصدار ذي عنوان قاعدة مرحل مختلف، فإنه يحدّث تسجيل المرحل بدلًا من إعادة استخدام الربط القديم.

ما الذي **لا** يحتاجه Gateway لهذا المسار:

- لا حاجة إلى رمز مرحل على مستوى النشر.
- لا حاجة إلى مفتاح APNs مباشر للإرسالات الرسمية/TestFlight المدعومة بالمرحل.

تدفق المشغّل المتوقع:

1. ثبّت إصدار iOS الرسمي/TestFlight.
2. اضبط `gateway.push.apns.relay.baseUrl` على Gateway.
3. اقترن التطبيق بـ Gateway ودعه يكمل الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائيًا بعد أن يحصل على رمز APNs، وتكون جلسة operator متصلة، وينجح تسجيل المرحل.
5. بعد ذلك، يمكن لـ `push.test` وعمليات تنبيه إعادة الاتصال والتنبيهات التحفيزية للاستيقاظ استخدام التسجيل المخزن والمدعوم بالمرحل.

ملاحظة توافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز env مؤقت لـ Gateway.

## المصادقة وتدفق الثقة

يوجد المرحل لفرض قيدين لا يمكن لـ APNs المباشر على Gateway توفيرهما
لإصدارات iOS الرسمية:

- لا يمكن استخدام المرحل المستضاف إلا من قِبل إصدارات OpenClaw iOS الأصلية الموزعة عبر Apple.
- لا يمكن لـ Gateway إرسال دفعات مدعومة بالمرحل إلا إلى أجهزة iOS التي اقترنت بذلك Gateway المحدد.

من خطوة إلى خطوة:

1. `iOS app -> gateway`
   - يقترن التطبيق أولًا مع Gateway عبر تدفق المصادقة العادي لـ Gateway.
   - وهذا يمنح التطبيق جلسة Node مصادقًا عليها بالإضافة إلى جلسة operator مصادقًا عليها.
   - تُستخدم جلسة operator لاستدعاء `gateway.identity.get`.

2. `iOS app -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل المرحل عبر HTTPS.
   - يتضمن التسجيل إثبات App Attest بالإضافة إلى إيصال التطبيق.
   - يتحقق المرحل من bundle ID، وإثبات App Attest، وإيصال Apple، ويتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - وهذا ما يمنع الإصدارات المحلية/إصدارات Xcode التطويرية من استخدام المرحل المستضاف. فقد يكون الإصدار المحلي
     موقّعًا، لكنه لا يستوفي إثبات التوزيع الرسمي من Apple الذي يتوقعه المرحل.

3. `gateway identity delegation`
   - قبل تسجيل المرحل، يجلب التطبيق هوية Gateway المقترن من
     `gateway.identity.get`.
   - يضمّن التطبيق هوية Gateway تلك في حمولة تسجيل المرحل.
   - يعيد المرحل handle مرحل ومنحة إرسال ضمن نطاق التسجيل مفوضين إلى
     هوية Gateway تلك.

4. `gateway -> relay`
   - يخزن Gateway handle المرحل ومنحة الإرسال من `push.apns.register`.
   - عند `push.test` وتنبيهات إعادة الاتصال والتنبيهات التحفيزية للاستيقاظ، يوقّع Gateway طلب الإرسال
     باستخدام هوية جهازه الخاصة.
   - يتحقق المرحل من كل من منحة الإرسال المخزنة وتوقيع Gateway مقابل
     هوية Gateway المفوضة من التسجيل.
   - لا يمكن لـ Gateway آخر إعادة استخدام ذلك التسجيل المخزن، حتى لو حصل بطريقة ما على الـ handle.

5. `relay -> APNs`
   - يمتلك المرحل بيانات اعتماد APNs الإنتاجية ورمز APNs الخام للإصدار الرسمي.
   - لا يخزن Gateway رمز APNs الخام للإصدارات الرسمية المدعومة بالمرحل.
   - يرسل المرحل الدفعة النهائية إلى APNs نيابةً عن Gateway المقترن.

سبب إنشاء هذا التصميم:

- لإبقاء بيانات اعتماد APNs الإنتاجية خارج Gateways الخاصة بالمستخدمين.
- لتجنب تخزين رموز APNs الخام الخاصة بالإصدارات الرسمية على Gateway.
- للسماح باستخدام المرحل المستضاف فقط لإصدارات OpenClaw الرسمية/TestFlight.
- لمنع Gateway من إرسال دفعات تنبيه للاستيقاظ إلى أجهزة iOS المملوكة لـ Gateway مختلف.

تظل الإصدارات المحلية/اليدوية على APNs المباشر. وإذا كنت تختبر تلك الإصدارات من دون المرحل، فإن
Gateway لا يزال يحتاج إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات env لوقت تشغيل مضيف Gateway، وليست إعدادات Fastlane. ولا يخزن `apps/ios/fastlane/.env` إلا
مصادقة App Store Connect / TestFlight مثل `ASC_KEY_ID` و`ASC_ISSUER_ID`؛ وهو لا يهيئ
التسليم المباشر لـ APNs لإصدارات iOS المحلية.

التخزين الموصى به على مضيف Gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تقم بعمل commit لملف `.p8` ولا تضعه تحت checkout الخاص بالمستودع.

## مسارات الاكتشاف

### Bonjour ‏(LAN)

يتصفح تطبيق iOS الخدمة `_openclaw-gw._tcp` على `local.`، وعند التهيئة، يتصفح أيضًا
نطاق اكتشاف DNS-SD واسع النطاق نفسه. وتظهر Gateways الموجودة على LAN نفسها تلقائيًا من `local.`;
أما الاكتشاف عبر الشبكات فيمكنه استخدام النطاق الواسع المهيأ من دون تغيير نوع beacon.

### Tailnet ‏(عبر الشبكات)

إذا كان mDNS محجوبًا، فاستخدم منطقة unicast DNS-SD ‏(اختر نطاقًا؛ مثال:
`openclaw.internal.`) وDNS المقسم لـ Tailscale.
راجع [Bonjour](/ar/gateway/bonjour) للاطلاع على مثال CoreDNS.

### مضيف/منفذ يدوي

في Settings، فعّل **Manual Host** وأدخل مضيف Gateway + المنفذ (الافتراضي `18789`).

## Canvas + A2UI

تعرض Node على iOS لوحة WKWebView canvas. استخدم `node.invoke` لقيادتها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يقدّم مضيف canvas في Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- ويُقدَّم من خادم HTTP الخاص بـ Gateway ‏(المنفذ نفسه لـ `gateway.port`، والافتراضي `18789`).
- تنتقل Node على iOS تلقائيًا إلى A2UI عند الاتصال عندما يتم الإعلان عن عنوان مضيف canvas.
- عُد إلى الهيكل المضمن باستخدام `canvas.navigate` و`{"url":""}`.

### تقييم / لقطة Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## التنبيه الصوتي + وضع Talk

- التنبيه الصوتي ووضع Talk متاحان في Settings.
- قد يعلّق iOS الصوت في الخلفية؛ لذا تعامل مع الميزات الصوتية على أنها بأفضل جهد عندما لا يكون التطبيق نشطًا.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: أحضر تطبيق iOS إلى الواجهة الأمامية (تتطلب أوامر canvas/camera/screen ذلك).
- `A2UI_HOST_NOT_CONFIGURED`: لم يعلن Gateway عن عنوان مضيف canvas؛ تحقق من `canvasHost` في [تهيئة Gateway](/ar/gateway/configuration).
- لا تظهر مطالبة الاقتران أبدًا: شغّل `openclaw devices list` ووافق يدويًا.
- فشل إعادة الاتصال بعد إعادة التثبيت: تم مسح رمز الاقتران في Keychain؛ أعد اقتران Node.

## مستندات ذات صلة

- [الاقتران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
