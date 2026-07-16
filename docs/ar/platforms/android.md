---
read_when:
    - إقران عقدة Android أو إعادة توصيلها
    - تصحيح أخطاء اكتشاف Gateway أو المصادقة على Android
    - عكس شاشة جهاز Android أو التحكم فيه من جهاز Mac بعيد
    - التحقق من تطابق سجل المحادثات عبر العملاء
summary: 'تطبيق Android ‏(Node): دليل تشغيل الاتصال + واجهة أوامر الاتصال/الدردشة/الصوت/Canvas'
title: تطبيق Android
x-i18n:
    generated_at: "2026-07-16T14:18:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
يتوفر تطبيق Android الرسمي على [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) وكملف APK مستقل موقّع ضمن [إصدارات GitHub](https://github.com/openclaw/openclaw/releases) المدعومة. وهو تطبيق Node مرافق ويتطلب تشغيل OpenClaw Gateway. المصدر: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([تعليمات البناء](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## ملخص الدعم

- الدور: تطبيق Node مرافق (لا يستضيف Android الـ Gateway).
- الـ Gateway مطلوب: نعم (شغّله على macOS أو Linux أو Windows عبر WSL2).
- التثبيت: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) أو `OpenClaw-Android.apk` من [إصدار GitHub](https://github.com/openclaw/openclaw/releases) مدعوم، ثم [بدء الاستخدام](/ar/start/getting-started) للـ Gateway، ثم [الإقران](/ar/channels/pairing).
- الـ Gateway: [دليل التشغيل](/ar/gateway) + [الإعداد](/ar/gateway/configuration).
  - البروتوكولات: [بروتوكول Gateway](/ar/gateway/protocol) (عُقد + مستوى التحكم).

يوجد التحكم في النظام (launchd/systemd) على مضيف الـ Gateway — راجع [Gateway](/ar/gateway).

## التثبيت من خارج Google Play

تتضمن إصدارات GitHub النهائية والتصحيحية المعتادة ملفًا عامًا `OpenClaw-Android.apk` وملف `OpenClaw-Android-SHA256SUMS.txt`. يُبنى ملف APK من وسم الإصدار، ويُوقّع بمفتاح إصدار Android الخاص بـ OpenClaw، ويتضمن إثبات مصدر من GitHub Actions.

اختر [إصدارًا](https://github.com/openclaw/openclaw/releases) يسرد كلا الأصلين، ثم نزّله وتحقق من ذلك الوسم تحديدًا قبل التثبيت الجانبي:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
تستخدم عمليات التثبيت من Google Play ومن ملف APK المستقل قنوات تحديث مختلفة، وقد تستخدم هويات توقيع مختلفة. قد يتطلب Android إلغاء تثبيت التطبيق الحالي قبل تبديل القنوات، ما يزيل بيانات التطبيق المحلية. التزم بقناة واحدة للتحديثات المعتادة.
</Warning>

## عكس شاشة Android والتحكم فيه من جهاز Mac بعيد

تعكس أداة [scrcpy](https://github.com/Genymobile/scrcpy) شاشة Android داخل نافذة على macOS، كما
تمرر إدخال لوحة المفاتيح والمؤشر عبر Android Debug Bridge (ADB). هذا سير عمل خاص بالمشغّل
ومنفصل عن اتصال Node في OpenClaw. وهو مفيد عندما يكون جهاز Android وجهاز
Mac في موقعين مختلفين لكنهما يشتركان في شبكة Tailscale خاصة.

### قبل البدء

- ثبّت Tailscale على جهاز Android وجهاز Mac، وصِل كليهما بشبكة tailnet نفسها.
- على Android، فعّل **Developer options** و**USB debugging**. يضع Android 16 خيار **Wireless
  debugging** ضمن **Settings > System > Developer options**. راجع [خيارات مطوّري
  Android](https://developer.android.com/studio/debug/dev-options).
- ثبّت scrcpy وADB على جهاز Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- أبقِ جهاز Android متاحًا للاتصال الأول. يجب أن يوافق Android على مفتاح ADB الخاص بكل جهاز Mac
  قبل أن يتمكن ذلك الجهاز من التحكم في الجهاز.

### تمكين ADB عبر TCP

للإعداد الأولي، صِل جهاز Android عبر USB بجهاز كمبيوتر موثوق ووافق على مطالبة
تصحيح الأخطاء. ثم شغّل:

```bash
adb devices
adb tcpip 5555
```

يمكنك الآن فصل USB. إذا توقف المنفذ 5555 عن الاستماع بعد إعادة تشغيل الجهاز أو إعادة ضبط تصحيح الأخطاء،
فكرر خطوة الإعداد المحلية هذه. يمكن أيضًا لـ Android 11 والإصدارات الأحدث إنشاء الثقة الأولية باستخدام
**Wireless debugging > Pair device with pairing code** و`adb pair`.

### السماح لجهاز Mac المتحكم فقط

يجب على شبكات tailnet ذات المنح التقييدية السماح صراحةً لجهاز Mac المتحكم بالوصول إلى منفذ TCP رقم 5555
على جهاز Android. أضف قاعدة ضيقة إلى سياسة tailnet، مع استبدال العناوين النموذجية
بعناوين IP الثابتة للجهازين على Tailscale:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

راجع [منح Tailscale](https://tailscale.com/docs/reference/syntax/grants) للاطلاع على الأسماء المستعارة للمضيفين والمحددات
الأخرى. لا تمنح هذا المنفذ للإنترنت العام ولا تكشفه باستخدام Funnel: إذ يمتلك عميل ADB
المصرح له تحكمًا واسعًا في الجهاز.

### الاتصال وبدء عكس الشاشة

على جهاز Mac البعيد:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

يعرض أول `adb connect` من جهاز Mac هذا مربع حوار تفويض على Android. افتح قفل الجهاز،
وأكد بصمة المفتاح، وحدد **Always allow from this computer** فقط عندما يكون جهاز Mac
موثوقًا. ينتهي إدخال `adb devices` الناجح بـ `device`؛ وتعني `unauthorized` أن المطالبة على الجهاز
لم تتم الموافقة عليها.

بعد فتح نافذة scrcpy، استخدمها مباشرة أو استهدفها بأداة لأتمتة الشاشة على macOS مثل
[Peekaboo](https://peekaboo.sh/). ينقل scrcpy العرض والإدخال؛ ولا يوفر Tailscale سوى
مسار الشبكة الخاصة.

### استكشاف الأخطاء وإصلاحها

- `Connection timed out`: تحقق من منحة tailnet لمنفذ TCP رقم 5555. يثبت نجاح `tailscale ping`
  إمكانية الوصول إلى النظير، وليس سماح السياسة بمنفذ TCP هذا. اختبر باستخدام
  `nc -vz <android-tailnet-ip> 5555` من جهاز Mac.
- `unauthorized`: افتح قفل Android ووافق على مفتاح ADB الخاص بجهاز Mac البعيد، أو أزل محطة العمل القديمة
  ضمن **Wireless debugging > Paired devices** وأقرنها مجددًا.
- `Connection refused`: أعد الاتصال محليًا وشغّل `adb tcpip 5555` مجددًا.
- وجود أكثر من جهاز في القائمة: أبقِ وسيطة `--serial <android-tailnet-ip>:5555` الصريحة.

عند الانتهاء، أغلق scrcpy وافصل ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## دليل تشغيل الاتصال

تطبيق Android Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

يتصل Android مباشرةً بـ WebSocket الخاص بالـ Gateway ويستخدم إقران الجهاز (`role: node`).

يتطلب Android نقطة نهاية آمنة لمضيفي Tailscale أو المضيفين العامين:

- المفضّل: Tailscale Serve / Funnel مع `https://<magicdns>` / `wss://<magicdns>`
- مدعوم أيضًا: أي عنوان URL آخر للـ Gateway من نوع `wss://` مع نقطة نهاية TLS حقيقية
- يظل `ws://` غير المشفر مدعومًا على عناوين LAN الخاصة / مضيفي `.local`، إضافة إلى `localhost` و`127.0.0.1` وجسر محاكي Android ‏(`10.0.2.2`)؛ ويستخدم الإعداد غير المرتبط بعنوان loopback تلقائيًا وصولًا محدودًا للمشغّل

### المتطلبات الأساسية

- تشغيل Gateway على جهاز آخر (أو إمكانية الوصول إليه عبر SSH).
- إمكانية وصول جهاز/محاكي Android إلى WebSocket الخاص بالـ Gateway:
  - شبكة LAN نفسها مع mDNS/NSD، **أو**
  - شبكة tailnet نفسها على Tailscale باستخدام Wide-Area Bonjour / ‏DNS-SD أحادي الإرسال (انظر أدناه)، **أو**
  - مضيف/منفذ Gateway يدوي (احتياطي)
- لا يستخدم الإقران عبر tailnet/الشبكة العامة على الأجهزة المحمولة نقاط نهاية IP مباشرة من نوع `ws://` على tailnet. استخدم Tailscale Serve أو عنوان URL آخر من نوع `wss://` بدلًا من ذلك.
- توفر CLI ‏`openclaw` على جهاز الـ Gateway (أو عبر SSH)، للموافقة على طلبات الإقران.

### 1. تشغيل Gateway

```bash
openclaw gateway --port 18789 --verbose
```

تأكد من ظهور شيء مماثل في السجلات:

- `listening on ws://0.0.0.0:18789`

للوصول البعيد من Android عبر Tailscale، فضّل Serve/Funnel بدلًا من الربط المباشر بعنوان tailnet:

```bash
openclaw gateway --tailscale serve
```

يوفر هذا لـ Android نقطة نهاية آمنة من نوع `wss://` / `https://`. لا يكفي إعداد `gateway.bind: "tailnet"` عادي لإقران Android عن بُعد للمرة الأولى، ما لم تُنهِ TLS بشكل منفصل أيضًا.

### 2. التحقق من الاكتشاف (اختياري)

من جهاز الـ Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

ملاحظات إضافية لتصحيح الأخطاء: [Bonjour](/ar/gateway/bonjour).

إذا أعددت أيضًا نطاق اكتشاف واسع النطاق، فقارن مع:

```bash
openclaw gateway discover --json
```

يعرض ذلك `local.` إلى جانب النطاق الواسع المُعد في تمريرة واحدة، باستخدام نقطة نهاية الخدمة المحلولة بدلًا من تلميحات TXT فقط.

#### الاكتشاف عبر الشبكات باستخدام DNS-SD أحادي الإرسال

لا يعبر اكتشاف NSD/mDNS في Android بين الشبكات. إذا كان Android Node والـ Gateway على شبكتين مختلفتين لكنهما متصلان عبر Tailscale، فاستخدم Wide-Area Bonjour / ‏DNS-SD أحادي الإرسال بدلًا من ذلك. لا يكفي الاكتشاف وحده لإقران Android عبر tailnet/الشبكة العامة — فلا يزال المسار المكتشف يحتاج إلى نقطة نهاية آمنة (`wss://` أو Tailscale Serve):

1. أعدّ نطاق DNS-SD (مثال: `openclaw.internal.`) على مضيف الـ Gateway وانشر سجلات `_openclaw-gw._tcp`.
2. أعدّ DNS المنقسم في Tailscale لنطاقك المختار بحيث يشير إلى خادم DNS ذلك.

التفاصيل ومثال لإعداد CoreDNS: [Bonjour](/ar/gateway/bonjour).

### 3. الاتصال من Android

في تطبيق Android:

- يحافظ التطبيق على اتصال الـ Gateway نشطًا عبر **خدمة في المقدمة** (إشعار دائم).
- افتح علامة التبويب **Connect**.
- استخدم وضع **Setup Code** أو **Manual**.
- إذا كان الاكتشاف محظورًا، فاستخدم المضيف/المنفذ اليدوي ضمن **Advanced controls**. بالنسبة إلى مضيفي LAN الخاصة، يظل `ws://` صالحًا. وبالنسبة إلى مضيفي Tailscale/المضيفين العامين، فعّل TLS واستخدم نقطة نهاية `wss://` / ‏Tailscale Serve.

بعد أول إقران ناجح، يعيد Android الاتصال تلقائيًا عند التشغيل بالـ Gateway المقترن النشط (وفق أفضل جهد للبوابات المكتشفة، التي يجب أن تكون ظاهرة على الشبكة).

تربط رموز الإعداد الرسمية Android باعتباره Node وتمنح وصول مشغّل كاملًا إلى Gateway
افتراضيًا عبر `wss://`. يستخدم إعداد `ws://` بالنص الصريح غير المرتبط بعنوان loopback
وصولًا محدودًا تلقائيًا حفاظًا على أمان رمز الحامل. تعرض **Settings → Gateway**
وصول **Full** أو **Limited**. بالنسبة إلى اتصال محدود، أعدّ
`wss://` أو Tailscale Serve، وأنشئ رمزًا جديدًا للوصول الكامل في Control UI أو
باستخدام `openclaw qr`، ثم امسحه ضوئيًا أو الصقه في تلك الصفحة وأعد الاتصال. يمكن للمشغّلين
الذين يريدون ملف التعريف المقيّد تحديد **Limited access** في Control UI أو تشغيل
`openclaw qr --limited`.

### بوابات متعددة

يحتفظ التطبيق بسجل لكل Gateway اقترن بها، بحيث يمكنك التبديل بينها دون إعادة الإقران:

- تعرض **Settings -> Gateways** البوابات المقترنة مع تمييز البوابة النشطة. اضغط على إدخال للتبديل؛ ينهي التطبيق الجلسات الحالية ويعيد الاتصال بالـ Gateway المحددة.
- تعرض علامة التبويب **Connect** أداة تبديل سريعة عند إقران أكثر من Gateway واحدة.
- تُخزّن بيانات الاعتماد، ورموز الأجهزة، وثقة TLS، وسجل المحادثات، والرسائل غير المتصلة الموضوعة في قائمة الانتظار لكل Gateway على حدة. لا يخلط التبديل الحالة بين البوابات مطلقًا، ولا تُسلّم الرسائل الموضوعة في قائمة الانتظار أثناء عدم الاتصال إلا إلى الـ Gateway التي كُتبت من أجلها.
- يزيل **Forget** إدخال الـ Gateway من السجل مع بيانات اعتمادها، ورموز أجهزتها، وتثبيت TLS، والمحادثات المخزنة مؤقتًا.

### إشارات إبقاء الحضور نشطًا

بعد اتصال جلسة Node المصادق عليها، وعندما ينتقل التطبيق إلى الخلفية بينما تظل الخدمة في المقدمة متصلة، يستدعي Android ‏`node.event` مع `event: "node.presence.alive"`. يسجّل الـ Gateway ذلك بوصفه `lastSeenAtMs`/`lastSeenReason` في بيانات Node/الجهاز المقترن الوصفية فقط بعد معرفة هوية جهاز Node المصادق عليها.

يعدّ التطبيق الإشارة مسجلة بنجاح فقط عندما تتضمن استجابة الـ Gateway القيمة `handled: true`. قد تقرّ البوابات الأقدم بـ `node.event` مع `{ "ok": true }`؛ وهذه الاستجابة متوافقة لكنها لا تُحتسب كتحديث دائم لآخر ظهور.

### 4. الموافقة على الإقران (CLI)

على جهاز الـ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

تفاصيل الاقتران: [الاقتران](/ar/channels/pairing).

اختياري: إذا كان Node بنظام Android يتصل دائمًا من شبكة فرعية محكمة التحكم، فيمكنك الاشتراك في الموافقة التلقائية على Node عند الاقتران لأول مرة باستخدام نطاقات CIDR صريحة أو عناوين IP دقيقة:

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

يكون هذا معطّلًا افتراضيًا. ولا ينطبق إلا على اقتران `role: node` جديد لا يتضمن أي نطاقات مطلوبة. أما اقتران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو المفتاح العام، فلا يزال يتطلب موافقة يدوية.

### 5. التحقق من اتصال Node

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. الدردشة + السجل

تدعم علامة تبويب الدردشة في Android تحديد الجلسة (الجلسة الافتراضية `main`، بالإضافة إلى الجلسات الأخرى الموجودة):

- السجل: `chat.history` (مُطبَّع للعرض — تُزال وسوم التوجيه المضمّنة، وحمولات XML النصية العادية لاستدعاءات الأدوات (`<tool_call>`، و`<function_call>`، و`<tool_calls>`، و`<function_calls>`، والصيغ المقتطعة منها)، ورموز التحكم المسرّبة للنموذج بنوعي ASCII والعرض الكامل؛ وتُحذف صفوف المساعد ذات الرموز الصامتة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا؛ ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة)
- الإرسال: `chat.send`
- الإرسال الدائم: يُسجَّل كل إرسال (النص والصور المختارة والملاحظات الصوتية) في صندوق صادر على الجهاز ومخصّص لكل Gateway قبل أي محاولة اتصال بالشبكة، وبذلك لا يؤدي إنهاء التطبيق إلى فقدان المدخلات المُرسلة. تُسلَّم عمليات الإرسال التي وُضعت في قائمة الانتظار أثناء انقطاع الاتصال بالترتيب عند إعادة الاتصال، باستخدام مفاتيح ثابتة لمنع التكرار، ولا تُزال عملية الإرسال إلا بعد أن يصبح الدور ظاهرًا في `chat.history` الأساسي — فلا يُعدّ الإقرار وحده دليلًا على التسليم. تظهر النتائج الملتبسة (فقدان الإقرار، أو إنهاء التطبيق أثناء الإرسال، أو إعادة تشغيل Gateway قبل كتابة النص المنسوخ) كصفوف مرئية تتضمن **إعادة المحاولة**/**حذف** صريحتين بدلًا من إعادة الإرسال تلقائيًا. لا تُعاد أبدًا أوامر الشرطة المائلة تلقائيًا بعد إعادة الاتصال؛ بل تتوقف حتى إعادة المحاولة صراحةً. قائمة الانتظار محدودة (50 رسالة و48 MB من بايتات المرفقات لكل Gateway)، وتنتهي صلاحية الصفوف غير المُرسلة بعد 48 ساعة. أما مسودات محرر الرسائل التي لم تُرسل قط، فلا تدوم عبر إنهاء العملية.
- التحديثات الفورية (وفق أفضل جهد): `chat.subscribe` -> `event:"chat"`
- الاستماع: اضغط مطولًا على رسالة للمساعد واختر **استماع** لسماعها؛ يُصيَّر الصوت عبر `tts.speak` في Gateway باستخدام سلسلة موفّري تحويل النص إلى كلام المضبوطة، ويُستخدم تحويل النص إلى كلام الخاص بالنظام على الجهاز عندما يتعذر على Gateway تصيير الصوت. يتوقف التشغيل عند تبديل الجلسة أو بدء دردشة جديدة أو انتقال التطبيق إلى الخلفية أو إغلاق الدردشة.

### 7. Canvas + الكاميرا

#### مضيف Canvas في Gateway (موصى به لمحتوى الويب)

لجعل Node يعرض HTML/CSS/JS حقيقيًا يمكن للوكيل تعديله على القرص، وجّه Node إلى مضيف Canvas في Gateway.

<Note>
تحمّل Nodes محتوى Canvas من خادم HTTP الخاص بـ Gateway (المنفذ نفسه المستخدم مع `gateway.port`، والقيمة الافتراضية `18789`).
</Note>

1. أنشئ `~/.openclaw/workspace/canvas/index.html` على مضيف Gateway.
2. انتقل إليه باستخدام Node (عبر LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (اختياري): إذا كان كلا الجهازين على Tailscale، فاستخدم اسم MagicDNS أو عنوان IP لشبكة tailnet بدلًا من `.local`، مثل `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

يحقن هذا الخادم عميل إعادة تحميل مباشرة في HTML ويعيد التحميل عند تغيّر الملفات. كما يقدّم Gateway المسار `/__openclaw__/a2ui/`، لكن تطبيق Android يعامل صفحات A2UI البعيدة على أنها مخصّصة للتصيير فقط. تستخدم أوامر A2UI القادرة على تنفيذ الإجراءات صفحة A2UI المضمّنة والمملوكة للتطبيق.

أوامر Canvas (في المقدمة فقط):

- `canvas.eval`، و`canvas.snapshot`، و`canvas.navigate` (استخدم `{"url":""}` أو `{"url":"/"}` للعودة إلى الهيكل الافتراضي). يعيد `canvas.snapshot` القيمة `{ format, base64 }` (القيمة الافتراضية `format="jpeg"`).
- A2UI: ‏`canvas.a2ui.push`، و`canvas.a2ui.reset` (الاسم المستعار القديم `canvas.a2ui.pushJSONL`). تستخدم هذه الأوامر صفحة A2UI المضمّنة والمملوكة للتطبيق لإجراء التصيير القادر على تنفيذ الإجراءات.

أوامر الكاميرا (في المقدمة فقط؛ تخضع للأذونات): `camera.snap` (jpg)، و`camera.clip` (mp4). راجع [Node الكاميرا](/ar/nodes/camera) لمعرفة المعلمات وأدوات CLI المساعدة.

### 8. الصوت + سطح أوامر Android الموسّع

- علامة تبويب الصوت: يتضمن Android وضعين صريحين للالتقاط. **الميكروفون** هو جلسة يدوية في علامة تبويب الصوت ترسل كل توقف مؤقت كدور دردشة، وتتوقف عندما يغادر التطبيق المقدمة أو يغادر المستخدم علامة تبويب الصوت. أما **التحدث** فهو وضع تحدث مستمر يواصل الاستماع حتى إيقافه أو انقطاع اتصال Node.
- يرقّي وضع التحدث خدمة المقدمة الحالية من `connectedDevice` إلى `connectedDevice|microphone` قبل بدء الالتقاط، ثم يخفضها عند توقف وضع التحدث. تعلن خدمة Node عن `FOREGROUND_SERVICE_CONNECTED_DEVICE` باستخدام `CHANGE_NETWORK_STATE`؛ ويتطلب Android 14+ أيضًا إعلان `FOREGROUND_SERVICE_MICROPHONE`، ومنح `RECORD_AUDIO` في وقت التشغيل، ونوع خدمة الميكروفون في وقت التشغيل.
- افتراضيًا، يستخدم وضع التحدث في Android التعرّف الأصلي على الكلام، ودردشة Gateway، و`talk.speak` عبر موفّر التحدث المضبوط في Gateway. لا يُستخدم تحويل النص إلى كلام الخاص بالنظام المحلي إلا عندما لا يتوفر `talk.speak`.
- لا يستخدم وضع التحدث في Android ترحيل Gateway في الوقت الفعلي إلا عندما تكون قيمة `talk.realtime.mode` هي `realtime` وقيمة `talk.realtime.transport` هي `gateway-relay`.
- لا يعلن Android عن إمكانية `voiceWake`. استخدم **الميكروفون** أو **التحدث** للإدخال الصوتي.
- مجموعات أوامر Android الإضافية (يعتمد توفرها على الجهاز والأذونات وإعدادات المستخدم):
  - `device.status`، و`device.info`، و`device.permissions`، و`device.health`
  - `device.apps` فقط عند تمكين **Settings > Phone Capabilities > Installed Apps**؛ ويسرد افتراضيًا التطبيقات الظاهرة في المشغّل (مرّر `includeNonLaunchable` للحصول على القائمة الكاملة).
  - `notifications.list`، و`notifications.actions` (راجع [إعادة توجيه الإشعارات](#notification-forwarding) أدناه)
  - `photos.latest`
  - `contacts.search`، و`contacts.add`
  - `calendar.events`، و`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`، و`motion.pedometer`

### 9. ملفات مساحة العمل (للقراءة فقط)

تتضمن نظرة الصفحة الرئيسية العامة بطاقة **الملفات** التي تستعرض مساحة عمل الوكيل النشط عبر استدعاءات RPC الخاصة بـ Gateway والمخصّصة للقراءة فقط، وهي `agents.workspace.list` / `agents.workspace.get`: التنقل داخل الأدلة، ومعاينة النصوص والصور، والتصدير عبر ورقة المشاركة في Android. لا توجد عمليات كتابة، وتفرض Gateway حدًا أقصى لحجم المعاينات.

## مراجعة موافقات الأوامر

يمكن لاتصال مشغّل يتضمن `operator.admin`، أو اتصال
`operator.approvals` مقترن يستهدفه Gateway صراحةً، مراجعة
طلبات التنفيذ المعلّقة ضمن **Settings -> Approvals**. يحمّل التطبيق
سجل الموافقة المنقّح من Gateway قبل تمكين أزراره، ويعرض أي
تحذير أمني والقرارات الدقيقة التي يتيحها ذلك الطلب، ثم يرسل
معرّف الموافقة ونوع المالك إلى Gateway.

تكون حالة الموافقة مشتركة مع واجهة التحكم وأسطح الدردشة المدعومة. تكون
الأولوية لأول إجابة مثبّتة؛ ويعرض Android تلك النتيجة الأساسية حتى عندما
يجيب سطح آخر أولًا. إذا فُقدت استجابة الحل أو انقطع اتصال Gateway،
يبقي التطبيق الإجراء مقفلًا ويقرأ الموافقة مجددًا
قبل إتاحة قرار آخر.

تعود Gateways الأقدم من طرق الموافقة الموحّدة إلى الطرق
الخاصة بالتنفيذ والمضمّنة في الإصدار. تظل مراجعة الطلبات المعلّقة تعمل، لكن حالة الطرفية
المحتفظ بها والنتيجة الأكثر تفصيلًا المشتركة بين الأسطح تتطلبان Gateway محدّثًا.

## نقاط دخول المساعد

يدعم Android تشغيل OpenClaw من مشغّل مساعد النظام (Google Assistant). يؤدي الضغط المطول على زر الشاشة الرئيسية (أو مشغّل `ACTION_ASSIST` آخر) إلى فتح التطبيق؛ وتتطابق عبارة "Hey Google, ask OpenClaw `<prompt>`" مع نمط استعلام App Actions المعلن في التطبيق، وتُمرّر المطالبة إلى محرر الدردشة من دون إرسالها تلقائيًا.

يستخدم هذا **App Actions** في Android (إمكانية `shortcuts.xml`) المعلنة في بيان التطبيق. لا يلزم أي إعداد من جانب Gateway — إذ يعالج تطبيق Android هدف المساعد بالكامل.

<Note>
يعتمد توفر App Actions على الجهاز وإصدار Google Play Services وما إذا كان المستخدم قد عيّن OpenClaw تطبيق المساعد الافتراضي.
</Note>

## إعادة توجيه الإشعارات

يمكن لنظام Android إعادة توجيه إشعارات الجهاز إلى Gateway كعناصر `node.event`. يُضبط هذا **على الجهاز**، في ورقة إعدادات التطبيق — وليس في إعدادات gateway/`openclaw.json`.

| الإعداد                     | الوصف                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Forward Notification Events | مفتاح التبديل الرئيسي. يكون متوقفًا افتراضيًا؛ ويتطلب أولًا منح صلاحية الوصول إلى مستمع الإشعارات.                                                                                                              |
| Package Filter              | **Allowlist** (لا تُعاد توجيه سوى معرّفات الحزم المدرجة) أو **Blocklist** (الافتراضي: كل الحزم باستثناء المعرّفات المدرجة). تُستثنى دائمًا حزمة OpenClaw نفسها في وضع Blocklist لمنع حلقات إعادة التوجيه. |
| Quiet Hours                 | نافذة بدء/انتهاء محلية بالتنسيق HH:mm تمنع إعادة التوجيه. تكون معطّلة افتراضيًا؛ وتستخدم `22:00`-`07:00` افتراضيًا بعد تمكينها.                                                                                |
| Max Events / Minute         | حد المعدل لكل جهاز للإشعارات المُعاد توجيهها. القيمة الافتراضية 20.                                                                                                                                          |
| Route Session Key           | اختياري. يثبّت أحداث الإشعارات المُعاد توجيهها في جلسة محددة بدلًا من مسار الإشعارات الافتراضي للجهاز.                                                                               |

<Note>
تتطلب إعادة توجيه الإشعارات إذن مستمع إشعارات Android. يطلب التطبيق هذا الإذن أثناء الإعداد.
</Note>

تُستثنى دائمًا إشعارات WhatsApp، وWhatsApp Business، وTelegram، وTelegram X، وDiscord، وSignal. فرسائلها مملوكة بالفعل لجلسات قنوات OpenClaw الأصلية؛ وقد تؤدي إعادة توجيه إشعار Android كحدث Node منفصل إلى توجيه الرد عبر المحادثة الخطأ.

## ذو صلة

- [تطبيق iOS](/ar/platforms/ios)
- [Nodes](/ar/nodes)
- [استكشاف أخطاء Node بنظام Android وإصلاحها](/ar/nodes/troubleshooting)
