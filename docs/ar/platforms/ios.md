---
read_when:
    - إقران Node ‏iOS أو إعادة اتصالها
    - تشغيل تطبيق iOS من المصدر
    - تصحيح أخطاء اكتشاف gateway أو أوامر canvas
summary: 'تطبيق iOS node: الاتصال بـ Gateway، والاقتران، وcanvas، واستكشاف الأخطاء وإصلاحها'
title: تطبيق iOS
x-i18n:
    generated_at: "2026-04-24T07:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

التوفر: معاينة داخلية. لم يتم توزيع تطبيق iOS علنًا بعد.

## ما الذي يفعله

- يتصل بـ Gateway عبر WebSocket ‏(LAN أو tailnet).
- يكشف قدرات node: ‏Canvas، ولقطة الشاشة، والتقاط الكاميرا، والموقع، ووضع التحدث، والتنبيه الصوتي.
- يستقبل أوامر `node.invoke` ويبلّغ عن أحداث حالة node.

## المتطلبات

- تشغيل Gateway على جهاز آخر (macOS، أو Linux، أو Windows عبر WSL2).
- مسار شبكة:
  - الشبكة المحلية نفسها عبر Bonjour، **أو**
  - tailnet عبر unicast DNS-SD ‏(مثال على النطاق: `openclaw.internal.`)، **أو**
  - مضيف/منفذ يدويًا (خيار احتياطي).

## البدء السريع (الاقتران + الاتصال)

1. ابدأ Gateway:

```bash
openclaw gateway --port 18789
```

2. في تطبيق iOS، افتح Settings واختر gateway مكتشفة (أو فعّل Manual Host وأدخل المضيف/المنفذ).

3. وافق على طلب الاقتران على مضيف gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

إذا أعاد التطبيق محاولة الاقتران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح العام)،
فسيتم استبدال الطلب المعلّق السابق وإنشاء `requestId` جديد.
شغّل `openclaw devices list` مرة أخرى قبل الموافقة.

4. تحقّق من الاتصال:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## الدفع المدعوم بالـ relay للبنى الرسمية

تستخدم البنى الرسمية الموزعة لتطبيق iOS مرحّل الدفع الخارجي بدلًا من نشر رمز APNs الخام
إلى gateway.

المتطلب على جانب Gateway:

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

- يسجل تطبيق iOS نفسه لدى relay باستخدام App Attest وإيصال التطبيق.
- تعيد relay مقبض relay معتمًا بالإضافة إلى إذن إرسال ضمن نطاق التسجيل.
- يجلب تطبيق iOS هوية gateway المقترنة ويضمّنها في تسجيل relay، بحيث يُفوَّض التسجيل المدعوم بالـ relay إلى تلك gateway المحددة.
- يمرر التطبيق هذا التسجيل المدعوم بالـ relay إلى gateway المقترنة عبر `push.apns.register`.
- تستخدم gateway مقبض relay المخزّن هذا من أجل `push.test`، والتنبيهات الخلفية، وتنبيهات الإيقاظ.
- يجب أن يطابق Base URL الخاص بـ gateway relay عنوان relay المضمّن داخل بنية iOS الرسمية/TestFlight.
- إذا اتصل التطبيق لاحقًا بـ gateway مختلفة أو ببنية تحتوي على Base URL مختلف للـ relay، فإنه يحدّث تسجيل relay بدلًا من إعادة استخدام الربط القديم.

ما الذي **لا تحتاجه** gateway لهذا المسار:

- لا يوجد رمز relay على مستوى النشر كله.
- لا يوجد مفتاح APNs مباشر لإرسالات relay المدعومة الخاصة بالبنى الرسمية/TestFlight.

تدفق المشغّل المتوقع:

1. ثبّت بنية iOS الرسمية/TestFlight.
2. اضبط `gateway.push.apns.relay.baseUrl` على gateway.
3. اقترن التطبيق مع gateway ودعه يُكمل الاتصال.
4. ينشر التطبيق `push.apns.register` تلقائيًا بعد أن يحصل على رمز APNs، ويتصل جلسة المشغّل، وينجح تسجيل relay.
5. بعد ذلك، يمكن لـ `push.test`، وإيقاظات إعادة الاتصال، وتنبيهات الإيقاظ استخدام التسجيل المخزّن والمدعوم بالـ relay.

ملاحظة التوافق:

- لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` يعمل كتجاوز env مؤقت للـ gateway.

## تدفق المصادقة والثقة

يوجد relay لفرض قيدين لا يمكن لـ APNs المباشر على gateway توفيرهما بالنسبة إلى
بنى iOS الرسمية:

- لا يمكن استخدام relay المستضاف إلا من قبل بنيات OpenClaw iOS الأصلية الموزعة عبر Apple.
- لا تستطيع gateway إرسال دفعات مدعومة بالـ relay إلا إلى أجهزة iOS التي اقترنت بتلك gateway المحددة.

خطوة بخطوة:

1. `تطبيق iOS -> gateway`
   - يقترن التطبيق أولًا مع gateway عبر تدفق مصادقة Gateway العادي.
   - وهذا يمنح التطبيق جلسة node موثقة بالإضافة إلى جلسة operator موثقة.
   - تُستخدم جلسة operator لاستدعاء `gateway.identity.get`.

2. `تطبيق iOS -> relay`
   - يستدعي التطبيق نقاط نهاية تسجيل relay عبر HTTPS.
   - يتضمن التسجيل إثبات App Attest بالإضافة إلى إيصال التطبيق.
   - تتحقق relay من bundle ID، وإثبات App Attest، وإيصال Apple، وتطلب
     مسار التوزيع الرسمي/الإنتاجي.
   - وهذا ما يمنع البنى المحلية من Xcode/التطوير من استخدام relay المستضافة. فقد تكون البنية المحلية
     موقعة، لكنها لا تلبّي إثبات التوزيع الرسمي من Apple الذي تتوقعه relay.

3. `تفويض هوية gateway`
   - قبل تسجيل relay، يجلب التطبيق هوية gateway المقترنة من
     `gateway.identity.get`.
   - يضمّن التطبيق هوية gateway تلك في حمولة تسجيل relay.
   - تعيد relay مقبض relay وإذن إرسال ضمن نطاق التسجيل مفوَّضًا إلى
     هوية gateway تلك.

4. `gateway -> relay`
   - تخزّن gateway مقبض relay وإذن الإرسال من `push.apns.register`.
   - عند `push.test`، وإيقاظات إعادة الاتصال، وتنبيهات الإيقاظ، توقّع gateway طلب الإرسال باستخدام
     هوية الجهاز الخاصة بها.
   - تتحقق relay من كلٍّ من إذن الإرسال المخزّن وتوقيع gateway مقابل
     هوية gateway المفوَّضة من التسجيل.
   - لا يمكن لـ gateway أخرى إعادة استخدام ذلك التسجيل المخزّن، حتى لو حصلت بطريقة ما على المقبض.

5. `relay -> APNs`
   - تمتلك relay بيانات اعتماد APNs الإنتاجية والرمز الخام لـ APNs للبنية الرسمية.
   - لا تخزّن gateway الرمز الخام لـ APNs للبنى الرسمية المدعومة بالـ relay.
   - ترسل relay الدفعة النهائية إلى APNs نيابة عن gateway المقترنة.

لماذا تم إنشاء هذا التصميم:

- لإبقاء بيانات اعتماد APNs الإنتاجية خارج Gateways الخاصة بالمستخدمين.
- لتجنب تخزين رموز APNs الخام الخاصة بالبنى الرسمية على gateway.
- للسماح باستخدام relay المستضافة فقط لبنيات OpenClaw الرسمية/TestFlight.
- لمنع Gateway واحدة من إرسال دفعات إيقاظ إلى أجهزة iOS تملكها Gateway مختلفة.

تظل البنى المحلية/اليدوية على APNs المباشر. وإذا كنت تختبر هذه البنى من دون relay، فإن
gateway لا تزال بحاجة إلى بيانات اعتماد APNs مباشرة:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

هذه متغيرات env وقت تشغيل على مضيف gateway، وليست إعدادات Fastlane. إذ لا يخزّن `apps/ios/fastlane/.env` إلا
مصادقة App Store Connect / TestFlight مثل `ASC_KEY_ID` و`ASC_ISSUER_ID`؛ وهو لا يضبط
التسليم المباشر لـ APNs من أجل بنيات iOS المحلية.

التخزين الموصى به على مضيف gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

لا تلتزم بملف `.p8` ولا تضعه تحت نسخة المستودع.

## مسارات الاكتشاف

### Bonjour ‏(LAN)

يستعرض تطبيق iOS الخدمة `_openclaw-gw._tcp` على `local.`، وعند الإعداد، على نطاق
اكتشاف wide-area DNS-SD نفسه. وتظهر Gateways الموجودة على LAN نفسها تلقائيًا من `local.`؛
أما الاكتشاف عبر الشبكات فيمكنه استخدام النطاق الواسع المهيأ من دون تغيير نوع beacon.

### Tailnet ‏(عبر الشبكات)

إذا كان mDNS محظورًا، فاستخدم منطقة unicast DNS-SD ‏(اختر نطاقًا؛ مثال:
`openclaw.internal.`) وTailscale split DNS.
راجع [Bonjour](/ar/gateway/bonjour) للحصول على مثال CoreDNS.

### المضيف/المنفذ اليدويان

في Settings، فعّل **Manual Host** وأدخل مضيف gateway + المنفذ (الافتراضي `18789`).

## Canvas + A2UI

تعرض iOS node لوحة canvas ضمن WKWebView. استخدم `node.invoke` للتحكم بها:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

ملاحظات:

- يقدّم مضيف canvas في Gateway المسارين `/__openclaw__/canvas/` و`/__openclaw__/a2ui/`.
- ويتم تقديمه من خادم HTTP الخاص بـ Gateway ‏(المنفذ نفسه مثل `gateway.port`، والافتراضي `18789`).
- تنتقل iOS node تلقائيًا إلى A2UI عند الاتصال عندما يتم الإعلان عن عنوان URL لمضيف canvas.
- ارجع إلى scaffold المدمجة باستخدام `canvas.navigate` و`{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## التنبيه الصوتي + وضع التحدث

- يتوفر التنبيه الصوتي ووضع التحدث في Settings.
- قد يعلّق iOS الصوت في الخلفية؛ لذا تعامل مع الميزات الصوتية على أنها بأفضل جهد عندما لا يكون التطبيق نشطًا.

## الأخطاء الشائعة

- `NODE_BACKGROUND_UNAVAILABLE`: اجلب تطبيق iOS إلى المقدمة (تتطلب أوامر canvas/camera/screen ذلك).
- `A2UI_HOST_NOT_CONFIGURED`: لم تعلن Gateway عن عنوان URL لمضيف canvas؛ تحقّق من `canvasHost` في [إعدادات Gateway](/ar/gateway/configuration).
- لا تظهر مطالبة الاقتران أبدًا: شغّل `openclaw devices list` ووافق يدويًا.
- يفشل إعادة الاتصال بعد إعادة التثبيت: تم مسح رمز الاقتران في Keychain؛ أعد اقتران node.

## مستندات ذات صلة

- [الاقتران](/ar/channels/pairing)
- [الاكتشاف](/ar/gateway/discovery)
- [Bonjour](/ar/gateway/bonjour)
