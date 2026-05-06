---
read_when:
    - إقران عقدة iOS أو إعادة الاتصال بها
    - تشغيل تطبيق iOS من المصدر
    - استكشاف أخطاء اكتشاف Gateway أو أوامر لوحة الرسم وإصلاحها
summary: 'تطبيق Node على iOS: الاتصال بـ Gateway، والاقتران، ولوحة الرسم، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
    generated_at: "2026-05-06T08:04:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

التوفر: معاينة داخلية. تطبيق iOS غير موزع للعامة بعد.

## ما الذي يفعله

- يتصل بـ Gateway عبر WebSocket (LAN أو tailnet).
- يعرض إمكانات Node: Canvas، ولقطة Screen، والتقاط Camera، وLocation، ووضع Talk، والتنبيه الصوتي.
- يستقبل أوامر `node.invoke` ويبلغ عن أحداث حالة Node.

## المتطلبات

- Gateway يعمل على جهاز آخر (macOS أو Linux أو Windows عبر WSL2).
- مسار الشبكة:
  - الشبكة المحلية نفسها عبر Bonjour، **أو**
  - Tailnet عبر DNS-SD أحادي البث (مثال للنطاق: `openclaw.internal.`)، **أو**
  - المضيف/المنفذ يدويًا (خيار احتياطي).

## البدء السريع (الإقران + الاتصال)

1. ابدأ Gateway:

```bash
openclaw gateway --port 18789
```

2. في تطبيق iOS، افتح Settings واختر Gateway مكتشفًا (أو فعّل Manual Host وأدخل المضيف/المنفذ).

3. وافق على طلب الإقران على مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد التطبيق محاولة الإقران بتفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيتم تجاوز الطلب المعلق السابق وإنشاء `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

اختياري: إذا كان Node iOS يتصل دائمًا من شبكة فرعية محكومة بإحكام، فيمكنك
اختيار الموافقة التلقائية لأول مرة على Node باستخدام CIDR صريحة أو عناوين IP دقيقة:

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

هذا معطّل افتراضيًا. ينطبق فقط على إقران `role: node` جديد
دون نطاقات مطلوبة. لا يزال إقران المشغل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام يتطلب موافقة يدوية.

4. تحقق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## الدفع المدعوم بالمرحل للإصدارات الرسمية

تستخدم إصدارات iOS الرسمية الموزعة مرحل الدفع الخارجي بدلًا من نشر رمز APNs
الخام إلى Gateway.

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
- يعيد المرحل مقبض مرحل مبهمًا مع منحة إرسال محددة بنطاق التسجيل.
- يجلب تطبيق iOS هوية Gateway المقترن ويضمّنها في تسجيل المرحل، بحيث يكون التسجيل المدعوم بالمرحل مفوضًا إلى Gateway المحدد هذا.
- يمرر التطبيق ذلك التسجيل المدعوم بالمرحل إلى Gateway المقترن باستخدام `push.apns.register`.
- يستخدم Gateway مقبض المرحل المخزن هذا من أجل `push.test`، والتنبيهات الخلفية، ودفعات التنبيه.
- يجب أن يطابق عنوان URL الأساسي لمرحل Gateway عنوان URL للمرحل المضمن في إصدار iOS الرسمي/TestFlight.
- إذا اتصل التطبيق لاحقًا بـ Gateway مختلف أو بإصدار له عنوان URL أساسي مختلف للمرحل، فإنه يحدّث تسجيل المرحل بدلًا من إعادة استخدام الربط القديم.

ما الذي لا يحتاج إليه Gateway لهذا المسار:

- لا يوجد رمز مرحل على مستوى النشر.
- لا يوجد مفتاح APNs مباشر للإرسالات الرسمية/TestFlight المدعومة بالمرحل.

تدفق المشغل المتوقع:

1. ثبّت إصدار iOS الرسمي/TestFlight.
2. اضبط `gateway.push.apns.relay.baseUrl` على Gateway.
3. أقرن التطبيق بـ Gateway ودعه يكمل الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائيًا بعد حصوله على رمز APNs، واتصال جلسة المشغل، ونجاح تسجيل المرحل.
5. بعد ذلك، يمكن لـ `push.test` وتنبيهات إعادة الاتصال ودفعات التنبيه استخدام التسجيل المخزن المدعوم بالمرحل.

## إشارات البقاء في الخلفية

عندما يوقظ iOS التطبيق لدفع صامت أو تحديث في الخلفية أو حدث موقع مهم، يحاول التطبيق
إعادة اتصال قصيرة لـ Node ثم يستدعي `node.event` مع `event: "node.presence.alive"`.
يسجل Gateway ذلك بوصفه `lastSeenAtMs`/`lastSeenReason` في البيانات الوصفية لـ Node/الجهاز المقترن فقط
بعد معرفة هوية جهاز Node المصادق عليه.

يتعامل التطبيق مع التنبيه في الخلفية على أنه مسجل بنجاح فقط عندما تتضمن استجابة Gateway
`handled: true`. قد تقر Gateways الأقدم بـ `node.event` باستخدام `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحتسب كتحديث دائم لآخر ظهور.

ملاحظة توافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز بيئي مؤقت لـ Gateway.

## تدفق المصادقة والثقة

يوجد المرحل لفرض قيدين لا يستطيع APNs المباشر على Gateway توفيرهما
لإصدارات iOS الرسمية:

- يمكن فقط لإصدارات iOS الأصلية من OpenClaw الموزعة عبر Apple استخدام المرحل المستضاف.
- يمكن لـ Gateway إرسال دفعات مدعومة بالمرحل فقط لأجهزة iOS التي اقترنت بذلك
  الـ Gateway المحدد.

قفزة بقفزة:

1. `iOS app -> gateway`
   - يقترن التطبيق أولًا بـ Gateway عبر تدفق مصادقة Gateway العادي.
   - يمنح ذلك التطبيق جلسة Node مصادقًا عليها إضافة إلى جلسة مشغل مصادق عليها.
   - تُستخدم جلسة المشغل لاستدعاء `gateway.identity.get`.

2. `iOS app -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل المرحل عبر HTTPS.
   - يتضمن التسجيل إثبات App Attest إضافة إلى معاملة تطبيق StoreKit بصيغة JWS.
   - يتحقق المرحل من معرّف الحزمة وإثبات App Attest وإثبات توزيع Apple، ويتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - هذا ما يمنع إصدارات Xcode/التطوير المحلية من استخدام المرحل المستضاف. قد يكون الإصدار المحلي
     موقعًا، لكنه لا يفي بإثبات توزيع Apple الرسمي الذي يتوقعه المرحل.

3. `gateway identity delegation`
   - قبل تسجيل المرحل، يجلب التطبيق هوية Gateway المقترن من
     `gateway.identity.get`.
   - يضمّن التطبيق هوية Gateway تلك في حمولة تسجيل المرحل.
   - يعيد المرحل مقبض مرحل ومنحة إرسال محددة بنطاق التسجيل ومفوضين إلى
     هوية Gateway تلك.

4. `gateway -> relay`
   - يخزن Gateway مقبض المرحل ومنحة الإرسال من `push.apns.register`.
   - عند `push.test`، وتنبيهات إعادة الاتصال، ودفعات التنبيه، يوقّع Gateway طلب الإرسال باستخدام
     هوية جهازه الخاصة.
   - يتحقق المرحل من منحة الإرسال المخزنة وتوقيع Gateway مقابل هوية
     Gateway المفوضة من التسجيل.
   - لا يستطيع Gateway آخر إعادة استخدام ذلك التسجيل المخزن، حتى لو حصل بطريقة ما على المقبض.

5. `relay -> APNs`
   - يملك المرحل بيانات اعتماد APNs الإنتاجية ورمز APNs الخام للإصدار الرسمي.
   - لا يخزن Gateway أبدًا رمز APNs الخام للإصدارات الرسمية المدعومة بالمرحل.
   - يرسل المرحل الدفعة النهائية إلى APNs نيابة عن Gateway المقترن.

سبب إنشاء هذا التصميم:

- إبقاء بيانات اعتماد APNs الإنتاجية خارج Gateways الخاصة بالمستخدمين.
- تجنب تخزين رموز APNs الخام للإصدار الرسمي على Gateway.
- السماح باستخدام المرحل المستضاف فقط لإصدارات OpenClaw الرسمية/TestFlight.
- منع Gateway واحد من إرسال دفعات إيقاظ إلى أجهزة iOS مملوكة لـ Gateway مختلف.

تبقى الإصدارات المحلية/اليدوية على APNs المباشر. إذا كنت تختبر تلك الإصدارات دون المرحل، فإن
Gateway لا يزال يحتاج إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات بيئة وقت تشغيل لمضيف Gateway، وليست إعدادات Fastlane. يخزن `apps/ios/fastlane/.env` فقط
مصادقة App Store Connect / TestFlight مثل `ASC_KEY_ID` و`ASC_ISSUER_ID`؛ ولا يهيئ
تسليم APNs المباشر لإصدارات iOS المحلية.

التخزين الموصى به على مضيف Gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تلتزم بملف `.p8` ولا تضعه ضمن نسخة المستودع المحلية.

## مسارات الاكتشاف

### Bonjour (LAN)

يتصفح تطبيق iOS `_openclaw-gw._tcp` على `local.`، وعند التهيئة، نفس
نطاق اكتشاف DNS-SD واسع النطاق. تظهر Gateways الموجودة على LAN نفسها تلقائيًا من `local.`؛
يمكن للاكتشاف عبر الشبكات استخدام النطاق واسع النطاق المهيأ دون تغيير نوع الإشارة.

### Tailnet (عبر الشبكات)

إذا كان mDNS محظورًا، فاستخدم منطقة DNS-SD أحادية البث (اختر نطاقًا؛ مثال:
`openclaw.internal.`) وTailscale split DNS.
راجع [Bonjour](/ar/gateway/bonjour) لمثال CoreDNS.

### المضيف/المنفذ اليدوي

في Settings، فعّل **Manual Host** وأدخل مضيف Gateway + المنفذ (الافتراضي `18789`).

## Canvas + A2UI

يعرض Node iOS لوحة WKWebView. استخدم `node.invoke` للتحكم بها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يقدم مضيف Canvas في Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- يُقدَّم من خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`، الافتراضي `18789`).
- ينتقل Node iOS تلقائيًا إلى A2UI عند الاتصال عندما يُعلن عن عنوان URL لمضيف Canvas.
- عُد إلى الهيكل المدمج باستخدام `canvas.navigate` و`{"url":""}`.

## العلاقة مع Computer Use

تطبيق iOS هو سطح Node محمول، وليس خلفية Codex Computer Use. يتحكم Codex
Computer Use و`cua-driver mcp` بسطح مكتب macOS محلي عبر أدوات MCP؛
ويعرض تطبيق iOS إمكانات iPhone عبر أوامر Node في OpenClaw
مثل `canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

لا يزال بإمكان الوكلاء تشغيل تطبيق iOS عبر OpenClaw من خلال استدعاء أوامر
Node، لكن هذه الاستدعاءات تمر عبر بروتوكول Node في Gateway وتتبع حدود iOS
في المقدمة/الخلفية. استخدم [Codex Computer Use](/ar/plugins/codex-computer-use)
للتحكم بسطح المكتب المحلي، وهذه الصفحة لإمكانات Node في iOS.

### تقييم Canvas / لقطة

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## التنبيه الصوتي + وضع Talk

- التنبيه الصوتي ووضع Talk متاحان في Settings.
- تعلن Nodes iOS القادرة على Talk عن إمكانية `talk` ويمكنها إعلان
  `talk.ptt.start` و`talk.ptt.stop` و`talk.ptt.cancel` و`talk.ptt.once`؛
  يسمح Gateway بأوامر الضغط للتحدث هذه افتراضيًا لـ Nodes
  الموثوقة والقادرة على Talk.
- قد يعلّق iOS الصوت في الخلفية؛ تعامل مع ميزات الصوت على أنها أفضل جهد عندما لا يكون التطبيق نشطًا.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: اجلب تطبيق iOS إلى المقدمة (تتطلب أوامر canvas/camera/screen ذلك).
- `A2UI_HOST_NOT_CONFIGURED`: لم يعلن Gateway عن عنوان URL لمضيف Canvas؛ تحقق من `canvasHost` في [تهيئة Gateway](/ar/gateway/configuration).
- لا تظهر مطالبة الإقران أبدًا: شغّل `openclaw devices list` ووافق يدويًا.
- تفشل إعادة الاتصال بعد إعادة التثبيت: تم مسح رمز إقران Keychain؛ أعد إقران Node.

## المستندات ذات الصلة

- [الإقران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
