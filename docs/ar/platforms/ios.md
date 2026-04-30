---
read_when:
    - إقران Node الخاص بـ iOS أو إعادة توصيله
    - تشغيل تطبيق iOS من المصدر
    - تصحيح أخطاء اكتشاف Gateway أو أوامر اللوحة
summary: 'تطبيق Node على iOS: الاتصال بـ Gateway، والإقران، واللوحة، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
    generated_at: "2026-04-30T08:10:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

التوفر: معاينة داخلية. تطبيق iOS غير موزع علنًا بعد.

## ما الذي يفعله

- يتصل بـ Gateway عبر WebSocket (LAN أو tailnet).
- يكشف قدرات Node: Canvas، ولقطة الشاشة، والتقاط الكاميرا، والموقع، ووضع التحدث، والتنبيه الصوتي.
- يستقبل أوامر `node.invoke` ويبلغ عن أحداث حالة Node.

## المتطلبات

- Gateway يعمل على جهاز آخر (macOS أو Linux أو Windows عبر WSL2).
- مسار الشبكة:
  - نفس LAN عبر Bonjour، **أو**
  - Tailnet عبر unicast DNS-SD (مثال على النطاق: `openclaw.internal.`)، **أو**
  - مضيف/منفذ يدوي (احتياطي).

## البدء السريع (الإقران + الاتصال)

1. ابدأ Gateway:

```bash
openclaw gateway --port 18789
```

2. في تطبيق iOS، افتح الإعدادات واختر gateway مكتشفًا (أو فعّل Manual Host وأدخل المضيف/المنفذ).

3. وافق على طلب الإقران على مضيف gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد التطبيق محاولة الإقران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيتم تجاوز الطلب المعلق السابق وإنشاء `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

اختياري: إذا كانت Node الخاصة بـ iOS تتصل دائمًا من شبكة فرعية مضبوطة بإحكام، فيمكنك
الاشتراك في الموافقة التلقائية لأول مرة على Node باستخدام CIDR صريحة أو عناوين IP دقيقة:

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

هذا معطل افتراضيًا. ينطبق فقط على إقران `role: node` جديد من دون
نطاقات مطلوبة. لا تزال إقرانات المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام تتطلب موافقة يدوية.

4. تحقق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## الدفع المدعوم بالمرحل للبنيات الرسمية

تستخدم بنيات iOS الرسمية الموزعة مرحل الدفع الخارجي بدلًا من نشر رمز APNs الخام
إلى gateway.

متطلب جانب Gateway:

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

- يسجل تطبيق iOS لدى المرحل باستخدام App Attest ومعاملة تطبيق StoreKit بصيغة JWS.
- يعيد المرحل مقبض مرحل معتمًا ومنحة إرسال محددة بنطاق التسجيل.
- يجلب تطبيق iOS هوية gateway المقترن ويضمنها في تسجيل المرحل، بحيث يتم تفويض التسجيل المدعوم بالمرحل إلى ذلك gateway المحدد.
- يمرر التطبيق ذلك التسجيل المدعوم بالمرحل إلى gateway المقترن باستخدام `push.apns.register`.
- يستخدم gateway مقبض المرحل المخزن هذا مع `push.test`، والتنبيهات الخلفية، ودفعات التنبيه.
- يجب أن يطابق عنوان URL الأساسي لمرحل gateway عنوان URL للمرحل المضمن في بنية iOS الرسمية/TestFlight.
- إذا اتصل التطبيق لاحقًا بـ gateway مختلف أو بنية ذات عنوان URL أساسي مختلف للمرحل، فإنه يحدّث تسجيل المرحل بدلًا من إعادة استخدام الربط القديم.

ما لا يحتاج إليه gateway في هذا المسار:

- لا يوجد رمز مرحل على مستوى النشر.
- لا يوجد مفتاح APNs مباشر لإرسالات الرسمية/TestFlight المدعومة بالمرحل.

تدفق المشغّل المتوقع:

1. ثبّت بنية iOS الرسمية/TestFlight.
2. اضبط `gateway.push.apns.relay.baseUrl` على gateway.
3. اقرن التطبيق بـ gateway ودعه يكمل الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائيًا بعد حصوله على رمز APNs، واتصال جلسة المشغّل، ونجاح تسجيل المرحل.
5. بعد ذلك، يمكن لـ `push.test`، وتنبيهات إعادة الاتصال، ودفعات التنبيه استخدام التسجيل المخزن المدعوم بالمرحل.

## إشارات الحياة في الخلفية

عندما يوقظ iOS التطبيق بسبب دفع صامت أو تحديث خلفي أو حدث موقع مهم، يحاول التطبيق
إعادة اتصال قصيرة لـ Node ثم يستدعي `node.event` مع `event: "node.presence.alive"`.
يسجل gateway ذلك كـ `lastSeenAtMs`/`lastSeenReason` في البيانات الوصفية لـ Node/الجهاز المقترن فقط
بعد معرفة هوية جهاز Node المصادق عليها.

يتعامل التطبيق مع إيقاظ الخلفية على أنه سُجل بنجاح فقط عندما تتضمن استجابة gateway
`handled: true`. قد تقر gateways الأقدم `node.event` باستخدام `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحتسب كتحديث دائم لآخر ظهور.

ملاحظة توافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز مؤقت عبر env لـ gateway.

## تدفق المصادقة والثقة

يوجد المرحل لفرض قيدين لا يمكن لـ APNs المباشر على gateway توفيرهما
لبنيات iOS الرسمية:

- لا يمكن استخدام المرحل المستضاف إلا من خلال بنيات OpenClaw iOS الأصلية الموزعة عبر Apple.
- لا يمكن لـ gateway إرسال دفعات مدعومة بالمرحل إلا لأجهزة iOS التي اقترنت بذلك
  gateway المحدد.

قفزة بعد قفزة:

1. `iOS app -> gateway`
   - يقترن التطبيق أولًا بـ gateway عبر تدفق مصادقة Gateway العادي.
   - يمنح ذلك التطبيق جلسة Node مصادقًا عليها بالإضافة إلى جلسة مشغّل مصادق عليها.
   - تُستخدم جلسة المشغّل لاستدعاء `gateway.identity.get`.

2. `iOS app -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل المرحل عبر HTTPS.
   - يتضمن التسجيل إثبات App Attest بالإضافة إلى معاملة تطبيق StoreKit بصيغة JWS.
   - يتحقق المرحل من معرف الحزمة، وإثبات App Attest، وإثبات توزيع Apple، ويتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - هذا ما يمنع بنيات Xcode/التطوير المحلية من استخدام المرحل المستضاف. قد تكون البنية المحلية
     موقعة، لكنها لا تستوفي إثبات توزيع Apple الرسمي الذي يتوقعه المرحل.

3. `gateway identity delegation`
   - قبل تسجيل المرحل، يجلب التطبيق هوية gateway المقترن من
     `gateway.identity.get`.
   - يضمن التطبيق هوية gateway تلك في حمولة تسجيل المرحل.
   - يعيد المرحل مقبض مرحل ومنحة إرسال محددة بنطاق التسجيل ومفوضة إلى
     هوية gateway تلك.

4. `gateway -> relay`
   - يخزن gateway مقبض المرحل ومنحة الإرسال من `push.apns.register`.
   - عند `push.test`، وتنبيهات إعادة الاتصال، ودفعات التنبيه، يوقع gateway طلب الإرسال باستخدام
     هوية جهازه الخاصة.
   - يتحقق المرحل من منحة الإرسال المخزنة وتوقيع gateway مقابل هوية
     gateway المفوضة من التسجيل.
   - لا يمكن لـ gateway آخر إعادة استخدام ذلك التسجيل المخزن، حتى إذا حصل بطريقة ما على المقبض.

5. `relay -> APNs`
   - يمتلك المرحل بيانات اعتماد APNs الإنتاجية ورمز APNs الخام للبنية الرسمية.
   - لا يخزن gateway أبدًا رمز APNs الخام للبنيات الرسمية المدعومة بالمرحل.
   - يرسل المرحل الدفع النهائي إلى APNs نيابة عن gateway المقترن.

سبب إنشاء هذا التصميم:

- إبقاء بيانات اعتماد APNs الإنتاجية خارج gateways المستخدمين.
- تجنب تخزين رموز APNs الخام لبنيات الرسمية على gateway.
- السماح باستخدام المرحل المستضاف فقط لبنيات OpenClaw الرسمية/TestFlight.
- منع gateway واحد من إرسال دفعات إيقاظ إلى أجهزة iOS مملوكة لـ gateway مختلف.

تبقى البنيات المحلية/اليدوية على APNs المباشر. إذا كنت تختبر تلك البنيات دون المرحل، فلا يزال
gateway يحتاج إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات env لوقت تشغيل مضيف gateway، وليست إعدادات Fastlane. لا يخزن `apps/ios/fastlane/.env` إلا
مصادقة App Store Connect / TestFlight مثل `ASC_KEY_ID` و `ASC_ISSUER_ID`؛ ولا يهيئ
تسليم APNs المباشر لبنيات iOS المحلية.

تخزين مضيف gateway الموصى به:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تلتزم بملف `.p8` أو تضعه ضمن نسخة repo المستخرجة.

## مسارات الاكتشاف

### Bonjour (LAN)

يتصفح تطبيق iOS `_openclaw-gw._tcp` على `local.`، وعند تهيئته، نطاق اكتشاف
DNS-SD واسع النطاق نفسه. تظهر gateways على نفس LAN تلقائيًا من `local.`؛
يمكن للاكتشاف عبر الشبكات استخدام النطاق واسع النطاق المهيأ من دون تغيير نوع الإشارة.

### Tailnet (عبر الشبكات)

إذا كان mDNS محظورًا، فاستخدم منطقة unicast DNS-SD (اختر نطاقًا؛ مثال:
`openclaw.internal.`) وTailscale split DNS.
راجع [Bonjour](/ar/gateway/bonjour) للاطلاع على مثال CoreDNS.

### مضيف/منفذ يدوي

في الإعدادات، فعّل **Manual Host** وأدخل مضيف gateway + المنفذ (الافتراضي `18789`).

## Canvas + A2UI

تعرض Node الخاصة بـ iOS لوحة WKWebView. استخدم `node.invoke` للتحكم بها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يخدم مضيف Canvas الخاص بـ Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- يُخدم من خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`، الافتراضي `18789`).
- تنتقل Node الخاصة بـ iOS تلقائيًا إلى A2UI عند الاتصال عندما يُعلن عن عنوان URL لمضيف Canvas.
- عُد إلى القالب المدمج باستخدام `canvas.navigate` و`{"url":""}`.

## العلاقة مع Computer Use

تطبيق iOS هو سطح Node للجوّال، وليس خلفية Codex Computer Use. يتحكم Codex
Computer Use و`cua-driver mcp` في سطح مكتب macOS محلي عبر أدوات MCP؛ يكشف تطبيق iOS
قدرات iPhone عبر أوامر Node في OpenClaw مثل
`canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

لا يزال بإمكان الوكلاء تشغيل تطبيق iOS عبر OpenClaw من خلال استدعاء أوامر
Node، لكن هذه الاستدعاءات تمر عبر بروتوكول Node الخاص بـ gateway وتتبع حدود iOS
للواجهة الأمامية/الخلفية. استخدم [Codex Computer Use](/ar/plugins/codex-computer-use)
للتحكم في سطح المكتب المحلي وهذه الصفحة لقدرات Node الخاصة بـ iOS.

### تقييم Canvas / لقطة

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## التنبيه الصوتي + وضع التحدث

- التنبيه الصوتي ووضع التحدث متاحان في الإعدادات.
- قد يعلّق iOS الصوت في الخلفية؛ تعامل مع الميزات الصوتية على أنها تبذل أفضل جهد عندما لا يكون التطبيق نشطًا.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: اجلب تطبيق iOS إلى الواجهة الأمامية (تتطلب أوامر canvas/camera/screen ذلك).
- `A2UI_HOST_NOT_CONFIGURED`: لم يعلن Gateway عن عنوان URL لمضيف Canvas؛ تحقق من `canvasHost` في [تهيئة Gateway](/ar/gateway/configuration).
- لا تظهر مطالبة الإقران أبدًا: شغّل `openclaw devices list` ووافق يدويًا.
- تفشل إعادة الاتصال بعد إعادة التثبيت: تم مسح رمز إقران Keychain؛ أعد إقران Node.

## الوثائق ذات الصلة

- [الإقران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
