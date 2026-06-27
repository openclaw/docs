---
read_when:
    - تشغيل إعدادات Gateway البعيدة أو استكشاف أخطائها وإصلاحها
summary: الوصول عن بُعد باستخدام Gateway WS وأنفاق SSH وشبكات tailnet
title: الوصول عن بُعد
x-i18n:
    generated_at: "2026-06-27T17:42:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

يدعم هذا المستودع الوصول إلى Gateway عن بُعد عبر إبقاء Gateway واحد (الرئيسي) قيد التشغيل على مضيف مخصص (سطح مكتب/خادم) وربط العملاء به.

- بالنسبة إلى **المشغّلين (أنت / تطبيق macOS)**: يكون WebSocket المباشر عبر LAN/Tailnet هو الأبسط عندما تكون البوابة قابلة للوصول؛ ويُعد نفق SSH خيار الرجوع العام.
- بالنسبة إلى **العُقد (iOS/Android والأجهزة المستقبلية)**: اتصل بـ Gateway **WebSocket** (LAN/tailnet أو نفق SSH حسب الحاجة).

## الفكرة الأساسية

- عادةً يرتبط Gateway WebSocket بـ **loopback** على المنفذ المضبوط لديك (الافتراضي 18789).
- للاستخدام عن بُعد، اكشفه عبر Tailscale Serve أو ربط LAN/Tailnet موثوق، أو مرّر منفذ loopback عبر SSH.

## إعدادات VPN وtailnet الشائعة

اعتبر **مضيف Gateway** هو المكان الذي يعيش فيه الوكيل. فهو يملك الجلسات وملفات تعريف المصادقة والقنوات والحالة. ويتصل حاسوبك المحمول وسطح المكتب والعُقد بذلك المضيف.

### Gateway دائم التشغيل في tailnet لديك

شغّل Gateway على مضيف دائم (VPS أو خادم منزلي) وصِل إليه عبر **Tailscale** أو SSH.

- **أفضل تجربة استخدام:** أبقِ `gateway.bind: "loopback"` واستخدم **Tailscale Serve** لواجهة Control UI.
- **LAN/Tailnet موثوق:** اربط البوابة بواجهة خاصة واتصل مباشرةً باستخدام `gateway.remote.transport: "direct"`.
- **خيار الرجوع:** أبقِ loopback مع نفق SSH من أي جهاز يحتاج إلى الوصول.
- **أمثلة:** [exe.dev](/ar/install/exe-dev) (آلة افتراضية سهلة) أو [Hetzner](/ar/install/hetzner) (VPS للإنتاج).

مثالي عندما يدخل حاسوبك المحمول في وضع السكون كثيرًا لكنك تريد بقاء الوكيل دائم التشغيل.

### سطح المكتب المنزلي يشغّل Gateway

الحاسوب المحمول **لا** يشغّل الوكيل. بل يتصل عن بُعد:

- استخدم وضع الاتصال عن بُعد في تطبيق macOS (الإعدادات → عام → تشغيل OpenClaw).
- يتصل التطبيق مباشرةً عندما تكون البوابة قابلة للوصول على LAN/Tailnet، أو يفتح نفق SSH ويديره عندما تختار SSH.

دليل التشغيل: [الوصول عن بُعد على macOS](/ar/platforms/mac/remote).

### الحاسوب المحمول يشغّل Gateway

أبقِ Gateway محليًا لكن اكشفه بأمان:

- أنشئ نفق SSH إلى الحاسوب المحمول من أجهزة أخرى، أو
- استخدم Tailscale Serve لواجهة Control UI وأبقِ Gateway مقتصرًا على loopback فقط.

الأدلة: [Tailscale](/ar/gateway/tailscale) و[نظرة عامة على الويب](/ar/web).

## تدفق الأوامر (ما الذي يعمل وأين)

تمتلك خدمة Gateway واحدة الحالة + القنوات. العُقد ملحقات طرفية.

مثال تدفق (Telegram → عُقدة):

- تصل رسالة Telegram إلى **Gateway**.
- يشغّل Gateway **الوكيل** ويقرر ما إذا كان سيستدعي أداة عُقدة.
- يستدعي Gateway **العُقدة** عبر Gateway WebSocket (استدعاء RPC `node.*`).
- تعيد العُقدة النتيجة؛ ويرد Gateway مجددًا عبر Telegram.

ملاحظات:

- **لا تشغّل العُقد خدمة البوابة.** يجب تشغيل بوابة واحدة فقط لكل مضيف ما لم تكن تشغّل ملفات تعريف معزولة عمدًا (راجع [بوابات متعددة](/ar/gateway/multiple-gateways)).
- "وضع العُقدة" في تطبيق macOS هو مجرد عميل عُقدة عبر Gateway WebSocket.

## نفق SSH (CLI + الأدوات)

أنشئ نفقًا محليًا إلى Gateway WS البعيد:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

عند تشغيل النفق:

- يصل `openclaw health` و`openclaw status --deep` الآن إلى البوابة البعيدة عبر `ws://127.0.0.1:18789`.
- يمكن أيضًا لـ `openclaw gateway status` و`openclaw gateway health` و`openclaw gateway probe` و`openclaw gateway call` استهداف عنوان URL المُمرَّر عبر `--url` عند الحاجة.

<Note>
استبدل `18789` بقيمة `gateway.port` المضبوطة لديك (أو `--port` أو `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
عندما تمرر `--url`، لا يرجع CLI إلى بيانات اعتماد الإعدادات أو البيئة. ضمّن `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Warning>

## الإعدادات الافتراضية للاتصال عن بُعد في CLI

يمكنك تثبيت هدف بعيد بحيث تستخدمه أوامر CLI افتراضيًا:

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

عندما تكون البوابة مقتصرة على loopback فقط، أبقِ عنوان URL على `ws://127.0.0.1:18789` وافتح نفق SSH أولًا.
في نقل نفق SSH داخل تطبيق macOS، تنتمي أسماء مضيفي البوابة المكتشفة إلى
`gateway.remote.sshTarget`؛ ويبقى `gateway.remote.url` عنوان URL للنفق المحلي.
إذا اختلفت تلك المنافذ، فاضبط `gateway.remote.remotePort` على منفذ البوابة على
مضيف SSH.

بالنسبة إلى بوابة قابلة للوصول بالفعل على LAN أو Tailnet موثوق، استخدم الوضع المباشر:

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

يتبع حل بيانات اعتماد Gateway عقدًا مشتركًا واحدًا عبر مسارات call/probe/status ومراقبة موافقة التنفيذ في Discord. يستخدم مضيف العُقدة العقد الأساسي نفسه مع استثناء واحد في الوضع المحلي (إذ يتجاهل `gateway.remote.*` عمدًا):

- بيانات الاعتماد الصريحة (`--token` أو `--password` أو أداة `gatewayToken`) تفوز دائمًا في مسارات الاستدعاء التي تقبل مصادقة صريحة.
- أمان تجاوز عنوان URL:
  - تجاوزات عنوان URL في CLI (`--url`) لا تعيد أبدًا استخدام بيانات اعتماد ضمنية من الإعدادات/البيئة.
  - قد تستخدم تجاوزات عنوان URL في البيئة (`OPENCLAW_GATEWAY_URL`) بيانات اعتماد البيئة فقط (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- افتراضيات الوضع المحلي:
  - الرمز: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (ينطبق الرجوع البعيد فقط عندما لا يكون إدخال رمز المصادقة المحلي مضبوطًا)
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (ينطبق الرجوع البعيد فقط عندما لا يكون إدخال كلمة مرور المصادقة المحلية مضبوطًا)
- افتراضيات الوضع البعيد:
  - الرمز: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثناء الوضع المحلي لمضيف العُقدة: يتم تجاهل `gateway.remote.token` / `gateway.remote.password`.
- تكون فحوصات رمز probe/status البعيدة صارمة افتراضيًا: تستخدم `gateway.remote.token` فقط (دون رجوع إلى الرمز المحلي) عند استهداف الوضع البعيد.
- تستخدم تجاوزات بيئة Gateway `OPENCLAW_GATEWAY_*` فقط.

## الوصول عن بُعد إلى واجهة الدردشة

لم يعد WebChat يستخدم منفذ HTTP منفصلًا. تتصل واجهة دردشة SwiftUI مباشرةً بـ Gateway WebSocket.

- مرّر `18789` عبر SSH (انظر أعلاه)، ثم صِل العملاء بـ `ws://127.0.0.1:18789`.
- بالنسبة إلى الوضع المباشر عبر LAN/Tailnet، صِل العملاء بعنوان URL الخاص المضبوط `ws://` أو الآمن `wss://`.
- على macOS، يُفضَّل وضع الاتصال عن بُعد في التطبيق، إذ يدير النقل المحدد تلقائيًا.

## وضع الاتصال عن بُعد في تطبيق macOS

يمكن لتطبيق شريط قوائم macOS قيادة الإعداد نفسه من البداية إلى النهاية (فحوصات الحالة عن بُعد، وWebChat، وتمرير Voice Wake).

دليل التشغيل: [الوصول عن بُعد على macOS](/ar/platforms/mac/remote).

## قواعد الأمان (عن بُعد/VPN)

الخلاصة: **أبقِ Gateway مقتصرًا على loopback فقط** ما لم تكن متأكدًا من حاجتك إلى ربط.

- **loopback + SSH/Tailscale Serve** هو الافتراضي الأكثر أمانًا (لا يوجد كشف عام).
- يُقبل `ws://` بنص صريح لـ loopback وLAN وlink-local و`.local` و`.ts.net` ومضيفي Tailscale CGNAT. يجب أن تستخدم المضيفات العامة البعيدة `wss://`.
- يجب أن تستخدم **الروابط غير loopback** (`lan`/`tailnet`/`custom`، أو `auto` عندما لا يكون loopback متاحًا) مصادقة البوابة: رمز أو كلمة مرور أو وكيل عكسي مدرك للهوية مع `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` هي مصادر بيانات اعتماد للعميل. وهي **لا** تضبط مصادقة الخادم بمفردها.
- يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كخيار رجوع فقط عندما يكون `gateway.auth.*` غير مضبوط.
- إذا تم ضبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حله، يفشل الحل بإغلاق آمن (دون إخفاء ذلك برجوع بعيد).
- يثبت `gateway.remote.tlsFingerprint` شهادة TLS البعيدة عند استخدام `wss://`، بما في ذلك الوضع المباشر على macOS. من دون بصمة مضبوطة أو محفوظة سابقًا، لا يثبت macOS شهادة الاستخدام الأول إلا بعد نجاح ثقة النظام العادية؛ وتحتاج بوابات الشهادات الذاتية التوقيع أو سلطات CA الخاصة التي لا يثق بها macOS مسبقًا إلى بصمة صريحة أو الاتصال عن بُعد عبر SSH.
- يمكن لـ **Tailscale Serve** مصادقة حركة Control UI/WebSocket عبر ترويسات الهوية
  عندما يكون `gateway.auth.allowTailscale: true`؛ لا تستخدم نقاط نهاية HTTP API
  مصادقة ترويسة Tailscale تلك، بل تتبع وضع مصادقة HTTP العادي للبوابة.
  يفترض هذا التدفق بلا رمز أن مضيف البوابة موثوق. اضبطه على
  `false` إذا أردت مصادقة السر المشترك في كل مكان.
- تتوقع مصادقة **trusted-proxy** إعدادات وكيل عكسي غير loopback ومدرك للهوية افتراضيًا.
  تتطلب الوكلاء العكسيون عبر loopback على المضيف نفسه `gateway.auth.trustedProxy.allowLoopback = true` صراحةً.
- تعامل مع التحكم من المتصفح مثل وصول المشغّل: tailnet فقط + إقران عُقد مقصود.

تعمق: [الأمان](/ar/gateway/security).

### macOS: نفق SSH دائم عبر LaunchAgent

بالنسبة إلى عملاء macOS المتصلين ببوابة بعيدة، يستخدم أسهل إعداد دائم إدخال إعداد SSH `LocalForward` بالإضافة إلى LaunchAgent لإبقاء النفق حيًا عبر إعادة التشغيل والأعطال.

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

#### الخطوة 3: اضبط رمز البوابة

خزّن الرمز في الإعدادات كي يستمر عبر عمليات إعادة التشغيل:

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

سيبدأ النفق تلقائيًا عند تسجيل الدخول، ويُعاد تشغيله عند التعطل، ويحافظ على المنفذ المُمرَّر نشطًا.

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

| إدخال الإعدادات                       | ما يفعله                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | يمرّر المنفذ المحلي 18789 إلى المنفذ البعيد 18789            |
| `ssh -N`                             | SSH من دون تنفيذ أوامر بعيدة (تمرير المنافذ فقط)             |
| `KeepAlive`                          | يعيد تشغيل النفق تلقائيًا إذا تعطل                           |
| `RunAtLoad`                          | يبدأ النفق عندما يتم تحميل LaunchAgent عند تسجيل الدخول      |

## ذو صلة

- [Tailscale](/ar/gateway/tailscale)
- [المصادقة](/ar/gateway/authentication)
- [إعداد Gateway البعيد](/ar/gateway/remote-gateway-readme)
