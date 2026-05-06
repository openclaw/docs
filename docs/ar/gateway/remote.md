---
read_when:
    - تشغيل إعدادات Gateway البعيدة أو استكشاف أخطائها وإصلاحها
summary: الوصول عن بُعد باستخدام أنفاق SSH (Gateway WS) وشبكات tailnet
title: الوصول عن بُعد
x-i18n:
    generated_at: "2026-05-06T07:56:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

يدعم هذا المستودع "الوصول البعيد عبر SSH" عبر إبقاء Gateway واحد (الرئيسي) يعمل على مضيف مخصص (سطح مكتب/خادم) وتوصيل العملاء به.

- بالنسبة إلى **المشغلين (أنت / تطبيق macOS)**: نفق SSH هو البديل العام.
- بالنسبة إلى **العُقد (iOS/Android والأجهزة المستقبلية)**: اتصل بـ **مقبس الويب** الخاص بـ Gateway (عبر الشبكة المحلية/الشبكة الخاصة أو نفق SSH حسب الحاجة).

## الفكرة الأساسية

- يرتبط مقبس الويب الخاص بـ Gateway بـ **local loopback** على المنفذ الذي ضبطته (الافتراضي هو 18789).
- للاستخدام البعيد، تمرر منفذ local loopback ذلك عبر SSH (أو تستخدم شبكة خاصة/VPN وتقلل الحاجة إلى الأنفاق).

## إعدادات VPN والشبكات الخاصة الشائعة

فكّر في **مضيف Gateway** بوصفه المكان الذي يعيش فيه الوكيل. فهو يملك الجلسات، وملفات تعريف المصادقة، والقنوات، والحالة. يتصل حاسوبك المحمول، وسطح المكتب، والعُقد بذلك المضيف.

### Gateway دائم التشغيل في شبكتك الخاصة

شغّل Gateway على مضيف دائم (VPS أو خادم منزلي) وصِل إليه عبر **Tailscale** أو SSH.

- **أفضل تجربة استخدام:** أبقِ `gateway.bind: "loopback"` واستخدم **Tailscale Serve** لواجهة التحكم.
- **البديل:** أبقِ local loopback مع نفق SSH من أي جهاز يحتاج إلى الوصول.
- **أمثلة:** [exe.dev](/ar/install/exe-dev) (آلة افتراضية سهلة) أو [Hetzner](/ar/install/hetzner) (VPS للإنتاج).

مثالي عندما يدخل حاسوبك المحمول في وضع السكون كثيرًا لكنك تريد الوكيل دائم التشغيل.

### سطح المكتب المنزلي يشغّل Gateway

الحاسوب المحمول **لا** يشغّل الوكيل. بل يتصل عن بُعد:

- استخدم وضع **الوصول البعيد عبر SSH** في تطبيق macOS (الإعدادات → عام → تشغيل OpenClaw).
- يفتح التطبيق النفق ويديره، لذلك تعمل WebChat وفحوصات السلامة مباشرة.

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

### الحاسوب المحمول يشغّل Gateway

أبقِ Gateway محليًا لكن اكشفه بأمان:

- نفق SSH إلى الحاسوب المحمول من أجهزة أخرى، أو
- استخدم Tailscale Serve لواجهة التحكم وأبقِ Gateway مقتصرًا على local loopback فقط.

الأدلة: [Tailscale](/ar/gateway/tailscale) و[نظرة عامة على الويب](/ar/web).

## تدفق الأوامر (ما الذي يعمل وأين)

تمتلك خدمة Gateway واحدة الحالة + القنوات. العُقد ملحقات طرفية.

مثال تدفق (Telegram → عقدة):

- تصل رسالة Telegram إلى **Gateway**.
- يشغّل Gateway **الوكيل** ويقرر ما إذا كان سيستدعي أداة عقدة.
- يستدعي Gateway **العقدة** عبر مقبس الويب الخاص بـ Gateway (`node.*` RPC).
- تعيد العقدة النتيجة؛ ويرد Gateway إلى Telegram.

ملاحظات:

- **العُقد لا تشغّل خدمة Gateway.** يجب تشغيل Gateway واحد فقط لكل مضيف إلا إذا كنت تشغّل عمدًا ملفات تعريف معزولة (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)).
- "وضع العقدة" في تطبيق macOS هو مجرد عميل عقدة عبر مقبس الويب الخاص بـ Gateway.

## نفق SSH (CLI + أدوات)

أنشئ نفقًا محليًا إلى مقبس الويب الخاص بـ Gateway البعيد:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

مع تشغيل النفق:

- يصل `openclaw health` و`openclaw status --deep` الآن إلى Gateway البعيد عبر `ws://127.0.0.1:18789`.
- يمكن أيضًا لـ `openclaw gateway status` و`openclaw gateway health` و`openclaw gateway probe` و`openclaw gateway call` استهداف عنوان URL المُمرَّر عبر `--url` عند الحاجة.

<Note>
استبدل `18789` بقيمة `gateway.port` التي ضبطتها (أو `--port` أو `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
عند تمرير `--url`، لا يرجع CLI إلى بيانات الاعتماد الموجودة في التكوين أو البيئة. ضمّن `--token` أو `--password` صراحة. غياب بيانات الاعتماد الصريحة خطأ.
</Warning>

## القيم الافتراضية البعيدة في CLI

يمكنك حفظ هدف بعيد بحيث تستخدمه أوامر CLI افتراضيًا:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

عندما يكون Gateway مقتصرًا على local loopback فقط، أبقِ عنوان URL على `ws://127.0.0.1:18789` وافتح نفق SSH أولًا.
في نقل نفق SSH الخاص بتطبيق macOS، توضع أسماء مضيف Gateway المكتشفة في
`gateway.remote.sshTarget`؛ ويبقى `gateway.remote.url` عنوان URL للنفق المحلي.

## أسبقية بيانات الاعتماد

يتبع حل بيانات اعتماد Gateway عقدًا مشتركًا واحدًا عبر مسارات الاستدعاء/الفحص/الحالة ومراقبة موافقة التنفيذ في Discord. يستخدم مضيف العقدة العقد الأساسي نفسه مع استثناء واحد في الوضع المحلي (يتجاهل عمدًا `gateway.remote.*`):

- بيانات الاعتماد الصريحة (`--token` أو `--password` أو أداة `gatewayToken`) تفوز دائمًا في مسارات الاستدعاء التي تقبل المصادقة الصريحة.
- أمان تجاوز عنوان URL:
  - لا تعيد تجاوزات عنوان URL في CLI (`--url`) استخدام بيانات اعتماد ضمنية من التكوين/البيئة أبدًا.
  - يجوز لتجاوزات عنوان URL في البيئة (`OPENCLAW_GATEWAY_URL`) استخدام بيانات اعتماد البيئة فقط (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- القيم الافتراضية للوضع المحلي:
  - الرمز المميز: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (ينطبق الرجوع البعيد فقط عندما لا تُعيَّن قيمة إدخال رمز المصادقة المحلي)
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (ينطبق الرجوع البعيد فقط عندما لا تُعيَّن قيمة إدخال كلمة مرور المصادقة المحلية)
- القيم الافتراضية للوضع البعيد:
  - الرمز المميز: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثناء الوضع المحلي لمضيف العقدة: يتم تجاهل `gateway.remote.token` / `gateway.remote.password`.
- فحوصات رمز الفحص/الحالة البعيدة صارمة افتراضيًا: تستخدم `gateway.remote.token` فقط (بدون رجوع إلى الرمز المحلي) عند استهداف الوضع البعيد.
- تستخدم تجاوزات بيئة Gateway ‏`OPENCLAW_GATEWAY_*` فقط.

## واجهة الدردشة عبر SSH

لم تعد WebChat تستخدم منفذ HTTP منفصلًا. تتصل واجهة دردشة SwiftUI مباشرة بمقبس الويب الخاص بـ Gateway.

- مرّر `18789` عبر SSH (انظر أعلاه)، ثم صِل العملاء بـ `ws://127.0.0.1:18789`.
- على macOS، فضّل وضع "الوصول البعيد عبر SSH" في التطبيق، الذي يدير النفق تلقائيًا.

## الوصول البعيد عبر SSH في تطبيق macOS

يمكن لتطبيق شريط القوائم على macOS تشغيل الإعداد نفسه من البداية إلى النهاية (فحوصات الحالة البعيدة، وWebChat، وتمرير Voice Wake).

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

## قواعد الأمان (بعيد/VPN)

النسخة المختصرة: **أبقِ Gateway مقتصرًا على local loopback فقط** إلا إذا كنت متأكدًا من أنك تحتاج إلى ربط.

- **local loopback + SSH/Tailscale Serve** هو الإعداد الافتراضي الأكثر أمانًا (لا تعريض عام).
- يكون النص الصريح `ws://` مقتصرًا على local loopback افتراضيًا. للشبكات الخاصة الموثوقة،
  عيّن `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` على عملية العميل بوصفه
  إجراء كسر زجاج. لا يوجد مكافئ في `openclaw.json`؛ يجب أن يكون هذا في بيئة
  العملية للعميل الذي ينشئ اتصال مقبس الويب.
- **الارتباطات غير المقتصرة على local loopback** (`lan`/`tailnet`/`custom`، أو `auto` عندما لا يتوفر local loopback) يجب أن تستخدم مصادقة Gateway: رمزًا مميزًا، أو كلمة مرور، أو وكيلاً عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` مصادر بيانات اعتماد للعميل. وهي **لا** تضبط مصادقة الخادم بمفردها.
- يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كرجوع فقط عندما لا تكون `gateway.auth.*` معيّنة.
- إذا تم ضبط `gateway.auth.token` / `gateway.auth.password` صراحة عبر SecretRef ولم يُحلا، يفشل الحل بإغلاق آمن (دون إخفاء عبر الرجوع البعيد).
- يثبت `gateway.remote.tlsFingerprint` شهادة TLS البعيدة عند استخدام `wss://`.
- يمكن لـ **Tailscale Serve** مصادقة حركة واجهة التحكم/مقبس الويب عبر رؤوس الهوية
  عندما تكون `gateway.auth.allowTailscale: true`؛ لا تستخدم نقاط نهاية HTTP API
  مصادقة رؤوس Tailscale تلك، بل تتبع وضع مصادقة HTTP العادي في Gateway.
  يفترض هذا التدفق بلا رمز مميز أن مضيف Gateway موثوق. عيّنه إلى
  `false` إذا كنت تريد مصادقة بسر مشترك في كل مكان.
- تتوقع مصادقة **الوكيل الموثوق** إعدادات وكيل غير مقتصرة على local loopback وواعية بالهوية افتراضيًا.
  تتطلب الوكلاء العكسيون عبر local loopback على المضيف نفسه ضبط `gateway.auth.trustedProxy.allowLoopback = true` صراحة.
- تعامل مع التحكم عبر المتصفح مثل وصول المشغّل: شبكة خاصة فقط + إقران عقد مقصود.

شرح معمق: [الأمان](/ar/gateway/security).

### macOS: نفق SSH دائم عبر LaunchAgent

بالنسبة إلى عملاء macOS المتصلين بـ Gateway بعيد، يستخدم أسهل إعداد دائم إدخال تكوين SSH باسم `LocalForward` بالإضافة إلى LaunchAgent لإبقاء النفق حيًا عبر عمليات إعادة التشغيل والانهيارات.

#### الخطوة 1: إضافة تكوين SSH

حرّر `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

استبدل `<REMOTE_IP>` و`<REMOTE_USER>` بقيمك.

#### الخطوة 2: نسخ مفتاح SSH (مرة واحدة)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### الخطوة 3: ضبط رمز Gateway المميز

خزّن الرمز المميز في التكوين كي يستمر عبر عمليات إعادة التشغيل:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### الخطوة 4: إنشاء LaunchAgent

احفظ هذا باسم `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### الخطوة 5: تحميل LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

سيبدأ النفق تلقائيًا عند تسجيل الدخول، ويُعاد تشغيله عند الانهيار، ويحافظ على المنفذ المُمرَّر حيًا.

<Note>
إذا كان لديك LaunchAgent متبقٍ باسم `com.openclaw.ssh-tunnel` من إعداد أقدم، فألغِ تحميله واحذفه.
</Note>

#### استكشاف الأخطاء وإصلاحها

تحقق مما إذا كان النفق يعمل:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

أعد تشغيل النفق:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

أوقف النفق:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| إدخال التكوين                        | ما الذي يفعله                                               |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | يمرّر المنفذ المحلي 18789 إلى المنفذ البعيد 18789            |
| `ssh -N`                             | SSH دون تنفيذ أوامر بعيدة (تمرير المنافذ فقط)                |
| `KeepAlive`                          | يعيد تشغيل النفق تلقائيًا إذا انهار                         |
| `RunAtLoad`                          | يبدأ النفق عند تحميل LaunchAgent أثناء تسجيل الدخول          |

## ذات صلة

- [Tailscale](/ar/gateway/tailscale)
- [المصادقة](/ar/gateway/authentication)
- [إعداد Gateway بعيد](/ar/gateway/remote-gateway-readme)
