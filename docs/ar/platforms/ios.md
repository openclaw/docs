---
read_when:
    - إقران عقدة iOS أو إعادة الاتصال بها
    - تشغيل تطبيق iOS من المصدر
    - تصحيح أخطاء اكتشاف Gateway أو أوامر اللوحة
summary: 'تطبيق Node على iOS: الاتصال بـ Gateway، والإقران، واللوحة، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
    generated_at: "2026-07-02T08:19:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

التوافر: تُوزَّع إصدارات تطبيق iPhone عبر قنوات Apple عند تفعيلها لإصدار ما. يمكن أيضًا تشغيل إصدارات التطوير المحلية من المصدر.

## ما الذي يفعله

- يتصل بـ Gateway عبر WebSocket (شبكة LAN أو tailnet).
- يوفّر إمكانات العقدة: Canvas، ولقطة شاشة، والتقاط الكاميرا، والموقع، ووضع التحدث، وتنبيه الصوت.
- يستقبل أوامر `node.invoke` ويبلّغ عن أحداث حالة العقدة.

## المتطلبات

- Gateway يعمل على جهاز آخر (macOS أو Linux أو Windows عبر WSL2).
- مسار شبكة:
  - شبكة LAN نفسها عبر Bonjour، **أو**
  - Tailnet عبر DNS-SD أحادي البث (نطاق مثال: `openclaw.internal.`)، **أو**
  - مضيف/منفذ يدوي (احتياطي).

## بدء سريع (إقران + اتصال)

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
فسيُستبدل الطلب السابق المعلّق ويُنشأ `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

اختياري: إذا كانت عقدة iOS تتصل دائمًا من شبكة فرعية مضبوطة بإحكام، يمكنك
الاشتراك في الموافقة التلقائية على العقدة في المرة الأولى باستخدام CIDR صريحة أو عناوين IP دقيقة:

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
من دون نطاقات مطلوبة. لا يزال إقران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام يتطلب موافقة يدوية.

4. تحقّق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## الدفع المدعوم بوسيط relay للإصدارات الرسمية

تستخدم إصدارات iOS الرسمية الموزعة وسيط الدفع الخارجي بدلًا من نشر رمز APNs
الأولي إلى Gateway.

تستخدم إصدارات App Store الرسمية من مسار الإصدار العام الوسيط المستضاف على `https://ios-push-relay.openclaw.ai`.

تتطلب عمليات نشر وسيط مخصصة مسار بناء/نشر iOS منفصلًا عن قصد يطابق عنوان URL الخاص بالوسيط فيه عنوان URL الخاص بوسيط Gateway. لا يقبل مسار إصدار App Store العام تجاوزات مخصصة لعنوان URL الخاص بالوسيط. إذا كنت تستخدم إصدار وسيط مخصصًا، فاضبط عنوان URL المطابق لوسيط Gateway:

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

- يسجّل تطبيق iOS لدى الوسيط باستخدام App Attest ومعاملة تطبيق StoreKit بصيغة JWS.
- يعيد الوسيط معرّف وسيط معتمًا بالإضافة إلى منحة إرسال مرتبطة بنطاق التسجيل.
- يجلب تطبيق iOS هوية Gateway المقترنة ويضمّنها في تسجيل الوسيط، لذلك يُفوَّض التسجيل المدعوم بالوسيط إلى Gateway المحددة تلك.
- يمرّر التطبيق ذلك التسجيل المدعوم بالوسيط إلى Gateway المقترنة باستخدام `push.apns.register`.
- يستخدم Gateway معرّف الوسيط المخزّن ذلك من أجل `push.test`، وتنبيهات الإيقاظ في الخلفية، ونبضات الإيقاظ.
- يجب أن تطابق عناوين URL المخصصة لوسيط Gateway عنوان URL الخاص بالوسيط المضمّن في إصدار iOS.
- إذا اتصل التطبيق لاحقًا بـ Gateway مختلفة أو بإصدار له عنوان URL أساسي مختلف للوسيط، فإنه يحدّث تسجيل الوسيط بدلًا من إعادة استخدام الربط القديم.

ما لا يحتاج إليه Gateway في هذا المسار:

- لا يوجد رمز وسيط على مستوى النشر.
- لا يوجد مفتاح APNs مباشر للإرسالات الرسمية المدعومة بوسيط من App Store.

تدفق المشغّل المتوقع:

1. ثبّت تطبيق iOS الرسمي.
2. اختياري: اضبط `gateway.push.apns.relay.baseUrl` على Gateway فقط عند استخدام إصدار وسيط مخصص منفصل عن قصد.
3. أقرن التطبيق مع Gateway ودعه ينهي الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائيًا بعد حصوله على رمز APNs، واتصال جلسة المشغّل، ونجاح تسجيل الوسيط.
5. بعد ذلك، يمكن لـ `push.test`، وتنبيهات إعادة الاتصال، ونبضات الإيقاظ استخدام التسجيل المخزّن المدعوم بالوسيط.

## إشارات البقاء في الخلفية

عندما يوقظ iOS التطبيق من أجل دفع صامت أو تحديث في الخلفية أو حدث موقع مهم، يحاول التطبيق
إعادة اتصال قصيرة للعقدة ثم يستدعي `node.event` مع `event: "node.presence.alive"`.
يسجّل Gateway ذلك بصفته `lastSeenAtMs`/`lastSeenReason` على البيانات الوصفية للعقدة/الجهاز المقترن فقط
بعد معرفة هوية جهاز العقدة المصادَق عليها.

يتعامل التطبيق مع إيقاظ الخلفية على أنه سُجّل بنجاح فقط عندما تتضمن استجابة Gateway
`handled: true`. قد تقرّ Gateways الأقدم بـ `node.event` باستخدام `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحتسب كتحديث دائم لآخر ظهور.

ملاحظة توافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز مؤقت لمتغير البيئة لـ Gateway.
- يرفض مسار إصدار App Store العام `OPENCLAW_PUSH_RELAY_BASE_URL` لإصدارات iOS.

## المصادقة وتدفق الثقة

يوجد الوسيط لفرض قيدين لا يستطيع APNs المباشر على Gateway توفيرهما
لإصدارات iOS الرسمية:

- لا يمكن استخدام الوسيط المستضاف إلا من إصدارات iOS الأصلية من OpenClaw الموزعة عبر Apple.
- لا يمكن لـ Gateway إرسال دفعات مدعومة بوسيط إلا لأجهزة iOS التي اقترنت مع Gateway المحددة تلك.

قفزة تلو الأخرى:

1. `iOS app -> gateway`
   - يقترن التطبيق أولًا مع Gateway عبر تدفق مصادقة Gateway العادي.
   - يمنح ذلك التطبيق جلسة عقدة مصادَق عليها بالإضافة إلى جلسة مشغّل مصادَق عليها.
   - تُستخدم جلسة المشغّل لاستدعاء `gateway.identity.get`.

2. `iOS app -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل الوسيط عبر HTTPS.
   - يتضمن التسجيل دليل App Attest بالإضافة إلى معاملة تطبيق StoreKit بصيغة JWS.
   - يتحقق الوسيط من معرّف الحزمة، ودليل App Attest، ودليل توزيع Apple، ويتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - هذا ما يمنع إصدارات Xcode/التطوير المحلية من استخدام الوسيط المستضاف. قد يكون الإصدار المحلي
     موقّعًا، لكنه لا يفي بدليل توزيع Apple الرسمي الذي يتوقعه الوسيط.

3. `gateway identity delegation`
   - قبل تسجيل الوسيط، يجلب التطبيق هوية Gateway المقترنة من
     `gateway.identity.get`.
   - يضمّن التطبيق هوية Gateway تلك في حمولة تسجيل الوسيط.
   - يعيد الوسيط معرّف وسيط ومنحة إرسال مرتبطة بنطاق التسجيل ومفوّضة إلى
     هوية Gateway تلك.

4. `gateway -> relay`
   - يخزّن Gateway معرّف الوسيط ومنحة الإرسال من `push.apns.register`.
   - عند `push.test`، وتنبيهات إعادة الاتصال، ونبضات الإيقاظ، يوقّع Gateway طلب الإرسال باستخدام
     هوية جهازه الخاصة.
   - يتحقق الوسيط من كل من منحة الإرسال المخزنة وتوقيع Gateway مقابل هوية
     Gateway المفوّضة من التسجيل.
   - لا يمكن لـ Gateway أخرى إعادة استخدام ذلك التسجيل المخزّن، حتى لو حصلت بطريقة ما على المعرّف.

5. `relay -> APNs`
   - يملك الوسيط بيانات اعتماد APNs الإنتاجية ورمز APNs الأولي للإصدار الرسمي.
   - لا يخزّن Gateway أبدًا رمز APNs الأولي للإصدارات الرسمية المدعومة بوسيط.
   - يرسل الوسيط الدفع النهائي إلى APNs نيابة عن Gateway المقترنة.

لماذا صُمم هذا التصميم:

- لإبقاء بيانات اعتماد APNs الإنتاجية خارج Gateways المستخدمين.
- لتجنب تخزين رموز APNs الأولية للإصدارات الرسمية على Gateway.
- للسماح باستخدام الوسيط المستضاف فقط لإصدارات iOS الرسمية من OpenClaw.
- لمنع Gateway واحد من إرسال دفعات إيقاظ إلى أجهزة iOS تملكها Gateway مختلفة.

تبقى الإصدارات المحلية/اليدوية على APNs مباشر. إذا كنت تختبر تلك الإصدارات من دون الوسيط، فلا يزال
Gateway يحتاج إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات بيئة وقت تشغيل على مضيف Gateway، وليست إعدادات Fastlane. يخزّن `apps/ios/fastlane/.env` فقط
مصادقة App Store Connect مثل `APP_STORE_CONNECT_KEY_ID` و
`APP_STORE_CONNECT_ISSUER_ID`؛ ولا يهيّئ تسليم APNs المباشر لإصدارات iOS المحلية.

التخزين الموصى به على مضيف Gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تُدخل ملف `.p8` في commit ولا تضعه تحت checkout المستودع.

## مسارات الاكتشاف

### Bonjour (LAN)

يتصفح تطبيق iOS خدمة `_openclaw-gw._tcp` على `local.`، وعند تهيئته، نطاق اكتشاف DNS-SD واسع النطاق نفسه. تظهر Gateways الموجودة على شبكة LAN نفسها تلقائيًا من `local.`؛
يمكن للاكتشاف عبر الشبكات استخدام النطاق واسع النطاق المهيأ من دون تغيير نوع الإشارة.

### Tailnet (عبر الشبكات)

إذا كان mDNS محظورًا، فاستخدم منطقة DNS-SD أحادية البث (اختر نطاقًا؛ مثال:
`openclaw.internal.`) وTailscale split DNS.
راجع [Bonjour](/ar/gateway/bonjour) للاطلاع على مثال CoreDNS.

### المضيف/المنفذ اليدوي

في الإعدادات، فعّل **المضيف اليدوي** وأدخل مضيف Gateway + المنفذ (الافتراضي `18789`).

## Canvas + A2UI

تعرض عقدة iOS لوحة WKWebView. استخدم `node.invoke` للتحكم بها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يقدّم مضيف Canvas في Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- يُقدَّم من خادم HTTP الخاص بـ Gateway (المنفذ نفسه مثل `gateway.port`، الافتراضي `18789`).
- تحتفظ عقدة iOS بالهيكل المضمّن كعرض افتراضي متصل. يستخدم `canvas.a2ui.push` و`canvas.a2ui.reset` صفحة A2UI المجمّعة والمملوكة للتطبيق.
- صفحات A2UI البعيدة من Gateway للعرض فقط على iOS؛ لا تُقبل إجراءات أزرار A2UI الأصلية إلا من الصفحات المجمّعة المملوكة للتطبيق.
- عُد إلى الهيكل المضمّن باستخدام `canvas.navigate` و`{"url":""}`.

## العلاقة مع Computer Use

تطبيق iOS هو سطح عقدة محمول، وليس خلفية Codex Computer Use. يتحكم Codex
Computer Use و`cua-driver mcp` في سطح مكتب macOS محلي عبر أدوات MCP؛
يعرض تطبيق iOS إمكانات iPhone عبر أوامر عقدة OpenClaw
مثل `canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

لا يزال بإمكان الوكلاء تشغيل تطبيق iOS عبر OpenClaw من خلال استدعاء أوامر
العقدة، لكن تلك الاستدعاءات تمر عبر بروتوكول عقدة Gateway وتتبع حدود iOS
في المقدمة/الخلفية. استخدم [Codex Computer Use](/ar/plugins/codex-computer-use)
للتحكم المحلي بسطح المكتب وهذه الصفحة لإمكانات عقدة iOS.

### تقييم Canvas / لقطة

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## تنبيه الصوت + وضع التحدث

- يتوفر تنبيه الصوت ووضع التحدث في الإعدادات.
- تعلن عقد iOS القادرة على التحدث عن قدرة `talk` ويمكنها التصريح بـ
  `talk.ptt.start` و`talk.ptt.stop` و`talk.ptt.cancel` و`talk.ptt.once`؛
  يسمح Gateway بأوامر الضغط للتحدث هذه افتراضيًا للعقد الموثوقة
  القادرة على التحدث.
- قد يعلّق iOS الصوت في الخلفية؛ تعامل مع ميزات الصوت كأفضل جهد عندما لا يكون التطبيق نشطًا.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: اجلب تطبيق iOS إلى المقدمة (تتطلب أوامر Canvas/الكاميرا/الشاشة ذلك).
- `A2UI_HOST_UNAVAILABLE`: لم يكن الوصول إلى صفحة A2UI المجمّعة ممكنًا في WebView التطبيق؛ أبقِ التطبيق في المقدمة على تبويب الشاشة وأعد المحاولة.
- لا تظهر مطالبة الإقران أبدًا: شغّل `openclaw devices list` ووافق يدويًا.
- تفشل إعادة الاتصال بعد إعادة التثبيت: تم مسح رمز إقران Keychain؛ أعد إقران العقدة.

## مستندات ذات صلة

- [الإقران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
