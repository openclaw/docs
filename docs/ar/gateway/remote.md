---
read_when:
    - تشغيل إعدادات Gateway البعيدة أو استكشاف أخطائها
summary: الوصول عن بُعد باستخدام Gateway WS وأنفاق SSH وشبكات tailnet
title: الوصول عن بُعد
x-i18n:
    generated_at: "2026-07-03T23:33:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

يدعم هذا المستودع الوصول البعيد إلى Gateway عبر إبقاء Gateway واحد (الرئيسي) قيد التشغيل على مضيف مخصص (سطح مكتب/خادم) وتوصيل العملاء به.

- بالنسبة إلى **المشغّلين (أنت / تطبيق macOS)**: يكون WebSocket المباشر عبر LAN/Tailnet هو الأبسط عندما يكون Gateway قابلاً للوصول؛ ويكون نفق SSH هو خيار الرجوع العام.
- بالنسبة إلى **العُقَد (iOS/Android والأجهزة المستقبلية)**: اتصل بـ Gateway **WebSocket** (LAN/tailnet أو نفق SSH حسب الحاجة).

## الفكرة الأساسية

- يرتبط Gateway WebSocket عادةً بـ **loopback** على المنفذ الذي ضبطته (الافتراضي 18789).
- للاستخدام البعيد، اكشفه عبر Tailscale Serve أو ربط LAN/Tailnet موثوق، أو مرّر منفذ loopback عبر SSH.

## إعدادات VPN وtailnet الشائعة

فكّر في **مضيف Gateway** على أنه المكان الذي يعيش فيه الوكيل. هو يملك الجلسات، وملفات تعريف المصادقة، والقنوات، والحالة. يتصل حاسوبك المحمول، وسطح المكتب، والعُقَد بذلك المضيف.

### Gateway دائم التشغيل في tailnet الخاص بك

شغّل Gateway على مضيف مستمر (VPS أو خادم منزلي) وصِل إليه عبر **Tailscale** أو SSH.

- **أفضل تجربة استخدام:** أبقِ `gateway.bind: "loopback"` واستخدم **Tailscale Serve** لواجهة التحكم.
- **LAN/Tailnet موثوق:** اربط Gateway بواجهة خاصة واتصل مباشرةً باستخدام `gateway.remote.transport: "direct"`.
- **خيار الرجوع:** أبقِ loopback مع نفق SSH من أي جهاز يحتاج إلى الوصول.
- **أمثلة:** [exe.dev](/ar/install/exe-dev) (آلة افتراضية سهلة) أو [Hetzner](/ar/install/hetzner) (VPS للإنتاج).

مثالي عندما يدخل حاسوبك المحمول في السكون كثيراً، لكنك تريد أن يبقى الوكيل دائم التشغيل.

### سطح المكتب المنزلي يشغّل Gateway

الحاسوب المحمول **لا** يشغّل الوكيل. بل يتصل عن بعد:

- استخدم الوضع البعيد في تطبيق macOS (الإعدادات → عام → تشغيل OpenClaw).
- يتصل التطبيق مباشرةً عندما يكون Gateway قابلاً للوصول على LAN/Tailnet، أو يفتح نفق SSH ويديره عندما تختار SSH.

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

### الحاسوب المحمول يشغّل Gateway

أبقِ Gateway محلياً لكن اكشفه بأمان:

- نفق SSH إلى الحاسوب المحمول من أجهزة أخرى، أو
- استخدم Tailscale Serve لواجهة التحكم وأبقِ Gateway مقتصراً على loopback فقط.

الأدلة: [Tailscale](/ar/gateway/tailscale) و[نظرة عامة على الويب](/ar/web).

## تدفق الأوامر (ما الذي يعمل وأين)

تملك خدمة Gateway واحدة الحالة + القنوات. العُقَد أجهزة طرفية.

مثال تدفق (Telegram → عُقدة):

- تصل رسالة Telegram إلى **Gateway**.
- يشغّل Gateway **الوكيل** ويقرر ما إذا كان سيستدعي أداة عُقدة.
- يستدعي Gateway **العُقدة** عبر Gateway WebSocket (`node.*` RPC).
- تعيد العُقدة النتيجة؛ ويرد Gateway إلى Telegram.

ملاحظات:

- **العُقَد لا تشغّل خدمة Gateway.** يجب تشغيل Gateway واحد فقط لكل مضيف ما لم تكن تشغّل ملفات تعريف معزولة عمداً (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)).
- "وضع العُقدة" في تطبيق macOS هو مجرد عميل عُقدة عبر Gateway WebSocket.

## نفق SSH (CLI + الأدوات)

أنشئ نفقاً محلياً إلى Gateway WS البعيد:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

مع تشغيل النفق:

- يصل `openclaw health` و`openclaw status --deep` الآن إلى Gateway البعيد عبر `ws://127.0.0.1:18789`.
- يمكن أيضاً لـ `openclaw gateway status` و`openclaw gateway health` و`openclaw gateway probe` و`openclaw gateway call` استهداف عنوان URL المُمرَّر عبر `--url` عند الحاجة.

<Note>
استبدل `18789` بقيمة `gateway.port` المضبوطة لديك (أو `--port` أو `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
عند تمرير `--url`، لا يرجع CLI إلى بيانات اعتماد الإعدادات أو البيئة. أضف `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Warning>

## الافتراضيات البعيدة لـ CLI

يمكنك حفظ هدف بعيد بحيث تستخدمه أوامر CLI افتراضياً:

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

عندما يكون Gateway مقتصراً على loopback فقط، أبقِ عنوان URL على `ws://127.0.0.1:18789` وافتح نفق SSH أولاً.
في نقل نفق SSH الخاص بتطبيق macOS، تنتمي أسماء مضيفي Gateway المكتشفة إلى
`gateway.remote.sshTarget`؛ ويبقى `gateway.remote.url` عنوان URL المحلي للنفق.
إذا اختلفت هذه المنافذ، فاضبط `gateway.remote.remotePort` على منفذ Gateway على
مضيف SSH.
التحقق من مفتاح المضيف صارم افتراضياً. يمكن للأسماء المستعارة المُدارة استخدام
سياسة الثقة الفعلية الخاصة بـ OpenSSH صراحةً عبر
`gateway.remote.sshHostKeyPolicy: "openssh"`؛ راجع إعدادات SSH المطابقة للمستخدم والنظام
قبل تمكينها.

بالنسبة إلى Gateway يمكن الوصول إليه بالفعل على LAN أو Tailnet موثوق، استخدم الوضع المباشر:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## أسبقية بيانات الاعتماد

يتبع حل بيانات اعتماد Gateway عقداً مشتركاً واحداً عبر مسارات call/probe/status ومراقبة موافقة تنفيذ Discord. يستخدم Node-host العقد الأساسي نفسه مع استثناء واحد للوضع المحلي (يتجاهل `gateway.remote.*` عمداً):

- بيانات الاعتماد الصريحة (`--token` أو `--password` أو أداة `gatewayToken`) تفوز دائماً في مسارات الاستدعاء التي تقبل مصادقة صريحة.
- أمان تجاوز عنوان URL:
  - تجاوزات عنوان URL في CLI (`--url`) لا تعيد أبداً استخدام بيانات اعتماد ضمنية من الإعدادات/البيئة.
  - قد تستخدم تجاوزات عنوان URL في البيئة (`OPENCLAW_GATEWAY_URL`) بيانات اعتماد البيئة فقط (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- افتراضيات الوضع المحلي:
  - الرمز المميز: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (ينطبق الرجوع البعيد فقط عندما يكون إدخال رمز المصادقة المحلي غير مضبوط)
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (ينطبق الرجوع البعيد فقط عندما يكون إدخال كلمة مرور المصادقة المحلية غير مضبوط)
- افتراضيات الوضع البعيد:
  - الرمز المميز: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثناء الوضع المحلي في Node-host: يتم تجاهل `gateway.remote.token` / `gateway.remote.password`.
- فحوصات رمز probe/status البعيد صارمة افتراضياً: تستخدم `gateway.remote.token` فقط (دون رجوع إلى رمز محلي) عند استهداف الوضع البعيد.
- تستخدم تجاوزات بيئة Gateway‏ `OPENCLAW_GATEWAY_*` فقط.

## الوصول البعيد إلى واجهة المحادثة

لم يعد WebChat يستخدم منفذ HTTP منفصلاً. تتصل واجهة محادثة SwiftUI مباشرةً بـ Gateway WebSocket.

- مرّر `18789` عبر SSH (راجع أعلاه)، ثم صِل العملاء بـ `ws://127.0.0.1:18789`.
- في الوضع المباشر عبر LAN/Tailnet، صِل العملاء بعنوان URL الخاص المضبوط `ws://` أو الآمن `wss://`.
- على macOS، فضّل الوضع البعيد في التطبيق، فهو يدير النقل المحدد تلقائياً.

## الوضع البعيد في تطبيق macOS

يمكن لتطبيق شريط قوائم macOS تشغيل الإعداد نفسه من البداية إلى النهاية (فحوصات الحالة البعيدة، وWebChat، وتمرير Voice Wake).

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

## قواعد الأمان (بعيد/VPN)

النسخة المختصرة: **أبقِ Gateway مقتصراً على loopback فقط** ما لم تكن متأكداً من أنك تحتاج إلى ربط.

- **Loopback + SSH/Tailscale Serve** هو الافتراضي الأكثر أماناً (لا تعرض عام).
- يتم قبول `ws://` بنص صريح لـ loopback وLAN وlink-local و`.local` و`.ts.net` ومضيفي Tailscale CGNAT. يجب أن تستخدم المضيفات البعيدة العامة `wss://`.
- **الربط غير loopback** (`lan`/`tailnet`/`custom`، أو `auto` عندما لا يكون loopback متاحاً) يجب أن يستخدم مصادقة Gateway: رمزاً مميزاً، أو كلمة مرور، أو وكيلاً عكسياً واعياً بالهوية مع `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` مصادر بيانات اعتماد للعميل. هي **لا** تضبط مصادقة الخادم بحد ذاتها.
- يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كرجوع فقط عندما يكون `gateway.auth.*` غير مضبوط.
- إذا تم ضبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يُحل، يفشل الحل بإغلاق آمن (دون إخفاء عبر الرجوع البعيد).
- يثبّت `gateway.remote.tlsFingerprint` شهادة TLS البعيدة عند استخدام `wss://`، بما في ذلك الوضع المباشر في macOS. دون بصمة مضبوطة أو محفوظة سابقاً، يثبّت macOS شهادة الاستخدام الأول فقط بعد نجاح الثقة النظامية العادية؛ وتحتاج بوابات الشهادات الذاتية التوقيع أو CA الخاصة التي لا يثق بها macOS مسبقاً إلى بصمة صريحة أو Remote over SSH.
- يمكن لـ **Tailscale Serve** مصادقة حركة واجهة التحكم/WebSocket عبر ترويسات الهوية
  عندما يكون `gateway.auth.allowTailscale: true`؛ لا تستخدم نقاط نهاية HTTP API
  مصادقة ترويسة Tailscale هذه، بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway.
  يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. اضبطه على
  `false` إذا كنت تريد مصادقة سر مشترك في كل مكان.
- تتوقع مصادقة **trusted-proxy** إعدادات وكيل غير loopback وواعية بالهوية افتراضياً.
  تتطلب الوكلاء العكسية المحلية على المضيف نفسه `gateway.auth.trustedProxy.allowLoopback = true` صراحةً.
- تعامل مع التحكم عبر المتصفح مثل وصول المشغّل: tailnet فقط + إقران عُقد مقصود.

شرح تفصيلي: [الأمان](/ar/gateway/security).

### macOS: نفق SSH مستمر عبر LaunchAgent

بالنسبة إلى عملاء macOS الذين يتصلون بـ Gateway بعيد، يستخدم أسهل إعداد مستمر إدخال إعداد SSH `LocalForward` مع LaunchAgent لإبقاء النفق حياً عبر عمليات إعادة التشغيل والانهيارات.

#### الخطوة 1: أضف إعداد SSH

حرّر `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

استبدل `<REMOTE_IP>` و`<REMOTE_USER>` بقيمك.

#### الخطوة 2: انسخ مفتاح SSH (مرة واحدة)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### الخطوة 3: اضبط رمز Gateway

خزّن الرمز في الإعدادات حتى يستمر عبر عمليات إعادة التشغيل:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### الخطوة 4: أنشئ LaunchAgent

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

#### الخطوة 5: حمّل LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

سيبدأ النفق تلقائياً عند تسجيل الدخول، ويُعاد تشغيله عند الانهيار، ويحافظ على المنفذ المُمرَّر نشطاً.

<Note>
إذا كان لديك LaunchAgent متبقٍ باسم `com.openclaw.ssh-tunnel` من إعداد أقدم، فألغِ تحميله واحذفه.
</Note>

#### استكشاف الأخطاء وإصلاحها

تحقق مما إذا كان النفق قيد التشغيل:

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

| إدخال الإعدادات                      | ما يفعله                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | يمرّر المنفذ المحلي 18789 إلى المنفذ البعيد 18789            |
| `ssh -N`                             | SSH دون تنفيذ أوامر بعيدة (تمرير المنافذ فقط)                |
| `KeepAlive`                          | يعيد تشغيل النفق تلقائياً إذا انهار                          |
| `RunAtLoad`                          | يبدأ النفق عندما يتم تحميل LaunchAgent عند تسجيل الدخول      |

## ذات صلة

- [Tailscale](/ar/gateway/tailscale)
- [المصادقة](/ar/gateway/authentication)
- [إعداد Gateway بعيد](/ar/gateway/remote-gateway-readme)
