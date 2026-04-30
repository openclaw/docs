---
read_when:
    - تشغيل إعدادات Gateway عن بُعد أو استكشاف أخطائها وإصلاحها
summary: الوصول عن بُعد باستخدام أنفاق SSH (Gateway WS) وشبكات tailnet
title: الوصول عن بُعد
x-i18n:
    generated_at: "2026-04-30T08:01:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

يدعم هذا المستودع “الاتصال البعيد عبر SSH” عبر إبقاء Gateway واحدة (الرئيسية) تعمل على مضيف مخصص (سطح مكتب/خادم) وربط العملاء بها.

- بالنسبة إلى **المشغلين (أنت / تطبيق macOS)**: يعد نفق SSH خيار الرجوع الشامل.
- بالنسبة إلى **العقد (iOS/Android والأجهزة المستقبلية)**: اتصل بـ **WebSocket** الخاص بـ Gateway (LAN/tailnet أو نفق SSH عند الحاجة).

## الفكرة الأساسية

- يرتبط WebSocket الخاص بـ Gateway بـ **loopback** على المنفذ الذي ضبطته (الافتراضي 18789).
- للاستخدام البعيد، تمرر منفذ loopback هذا عبر SSH (أو تستخدم tailnet/VPN وتقلل الحاجة إلى الأنفاق).

## إعدادات VPN وtailnet الشائعة

فكر في **مضيف Gateway** على أنه المكان الذي يعيش فيه الوكيل. فهو يملك الجلسات وملفات تعريف المصادقة والقنوات والحالة. يتصل حاسوبك المحمول وسطح المكتب والعقد بذلك المضيف.

### Gateway دائمة التشغيل في tailnet لديك

شغّل Gateway على مضيف دائم (VPS أو خادم منزلي) ثم صِل إليها عبر **Tailscale** أو SSH.

- **أفضل تجربة استخدام:** أبقِ `gateway.bind: "loopback"` واستخدم **Tailscale Serve** لواجهة التحكم.
- **خيار الرجوع:** أبقِ loopback مع نفق SSH من أي جهاز يحتاج إلى الوصول.
- **أمثلة:** [exe.dev](/ar/install/exe-dev) (VM سهلة) أو [Hetzner](/ar/install/hetzner) (VPS للإنتاج).

مثالي عندما يدخل حاسوبك المحمول في وضع السكون كثيرًا لكنك تريد أن يبقى الوكيل دائم التشغيل.

### سطح المكتب المنزلي يشغّل Gateway

لا يشغّل الحاسوب المحمول الوكيل. بل يتصل عن بعد:

- استخدم وضع **الاتصال البعيد عبر SSH** في تطبيق macOS (الإعدادات → عام → تشغيل OpenClaw).
- يفتح التطبيق النفق ويديره، لذلك تعمل WebChat وفحوصات السلامة مباشرة.

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

### الحاسوب المحمول يشغّل Gateway

أبقِ Gateway محلية لكن اكشفها بأمان:

- أنشئ نفق SSH إلى الحاسوب المحمول من أجهزة أخرى، أو
- استخدم Tailscale Serve لواجهة التحكم وأبقِ Gateway مقتصرة على loopback.

الأدلة: [Tailscale](/ar/gateway/tailscale) و[نظرة عامة على الويب](/ar/web).

## تدفق الأوامر (ما الذي يعمل وأين)

تمتلك خدمة Gateway واحدة الحالة + القنوات. العقد أجهزة طرفية.

مثال تدفق (Telegram → عقدة):

- تصل رسالة Telegram إلى **Gateway**.
- تشغّل Gateway **الوكيل** وتقرر ما إذا كانت ستستدعي أداة عقدة.
- تستدعي Gateway **العقدة** عبر WebSocket الخاص بـ Gateway (`node.*` RPC).
- تعيد العقدة النتيجة؛ وترد Gateway إلى Telegram.

ملاحظات:

- **لا تشغّل العقد خدمة Gateway.** يجب تشغيل Gateway واحدة فقط لكل مضيف إلا إذا كنت تشغّل عمدًا ملفات تعريف معزولة (انظر [بوابات متعددة](/ar/gateway/multiple-gateways)).
- وضع “العقدة” في تطبيق macOS هو مجرد عميل عقدة عبر WebSocket الخاص بـ Gateway.

## نفق SSH (CLI + الأدوات)

أنشئ نفقًا محليًا إلى Gateway WS البعيدة:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

مع تشغيل النفق:

- يصل `openclaw health` و`openclaw status --deep` الآن إلى Gateway البعيدة عبر `ws://127.0.0.1:18789`.
- يمكن أيضًا أن تستهدف `openclaw gateway status` و`openclaw gateway health` و`openclaw gateway probe` و`openclaw gateway call` عنوان URL الممرر عبر `--url` عند الحاجة.

<Note>
استبدل `18789` بقيمة `gateway.port` التي ضبطتها (أو `--port` أو `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
عندما تمرر `--url`، لا يعود CLI إلى بيانات الاعتماد من الإعدادات أو البيئة. أدرج `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
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

عندما تكون Gateway مقتصرة على loopback، أبقِ عنوان URL على `ws://127.0.0.1:18789` وافتح نفق SSH أولًا.
في نقل نفق SSH الخاص بتطبيق macOS، تنتمي أسماء مضيفات Gateway المكتشفة إلى
`gateway.remote.sshTarget`؛ ويظل `gateway.remote.url` عنوان URL المحلي للنفق.

## أسبقية بيانات الاعتماد

يتبع حل بيانات اعتماد Gateway عقدًا مشتركًا واحدًا عبر مسارات call/probe/status ومراقبة موافقة تنفيذ Discord. يستخدم مضيف العقدة العقد الأساسي نفسه مع استثناء واحد للوضع المحلي (يتجاهل عمدًا `gateway.remote.*`):

- بيانات الاعتماد الصريحة (`--token` أو `--password` أو أداة `gatewayToken`) تفوز دائمًا في مسارات الاستدعاء التي تقبل مصادقة صريحة.
- أمان تجاوز عنوان URL:
  - لا تعيد تجاوزات عنوان URL في CLI (`--url`) استخدام بيانات اعتماد ضمنية من الإعدادات/البيئة أبدًا.
  - قد تستخدم تجاوزات عنوان URL من البيئة (`OPENCLAW_GATEWAY_URL`) بيانات اعتماد البيئة فقط (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- القيم الافتراضية للوضع المحلي:
  - الرمز: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (ينطبق الرجوع البعيد فقط عندما يكون إدخال رمز المصادقة المحلي غير مضبوط)
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (ينطبق الرجوع البعيد فقط عندما يكون إدخال كلمة مرور المصادقة المحلية غير مضبوط)
- القيم الافتراضية للوضع البعيد:
  - الرمز: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثناء الوضع المحلي لمضيف العقدة: يتم تجاهل `gateway.remote.token` / `gateway.remote.password`.
- تكون فحوصات رمز probe/status البعيدة صارمة افتراضيًا: تستخدم `gateway.remote.token` فقط (دون رجوع إلى الرمز المحلي) عند استهداف الوضع البعيد.
- تستخدم تجاوزات بيئة Gateway `OPENCLAW_GATEWAY_*` فقط.

## واجهة الدردشة عبر SSH

لم تعد WebChat تستخدم منفذ HTTP منفصلًا. تتصل واجهة دردشة SwiftUI مباشرة بـ WebSocket الخاص بـ Gateway.

- مرّر `18789` عبر SSH (انظر أعلاه)، ثم صِل العملاء بـ `ws://127.0.0.1:18789`.
- على macOS، فضّل وضع “الاتصال البعيد عبر SSH” في التطبيق، فهو يدير النفق تلقائيًا.

## تطبيق macOS والاتصال البعيد عبر SSH

يمكن لتطبيق شريط القوائم في macOS تشغيل الإعداد نفسه من البداية إلى النهاية (فحوصات الحالة البعيدة، وWebChat، وتمرير Voice Wake).

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

## قواعد الأمان (بعيد/VPN)

النسخة المختصرة: **أبقِ Gateway مقتصرة على loopback** إلا إذا كنت متأكدًا أنك تحتاج إلى ربط.

- **Loopback + SSH/Tailscale Serve** هو الخيار الافتراضي الأكثر أمانًا (دون كشف عام).
- يكون النص الصريح `ws://` مقتصرًا على loopback افتراضيًا. للشبكات الخاصة الموثوقة،
  اضبط `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` على عملية العميل كإجراء
  طارئ. لا يوجد مكافئ في `openclaw.json`؛ يجب أن يكون هذا في بيئة
  العملية للعميل الذي ينشئ اتصال WebSocket.
- **الربط غير المحلي** (`lan`/`tailnet`/`custom`، أو `auto` عندما لا يتوفر loopback) يجب أن يستخدم مصادقة Gateway: رمزًا أو كلمة مرور أو وكيلًا عكسيًا واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` هي مصادر بيانات اعتماد للعميل. وهي **لا** تضبط مصادقة الخادم بحد ذاتها.
- يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كخيار رجوع فقط عندما يكون `gateway.auth.*` غير مضبوط.
- إذا تم ضبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم يتم حلّه، يفشل الحل بإغلاق آمن (دون إخفاء ذلك برجوع بعيد).
- يثبت `gateway.remote.tlsFingerprint` شهادة TLS البعيدة عند استخدام `wss://`.
- يمكن لـ **Tailscale Serve** مصادقة حركة مرور واجهة التحكم/WebSocket عبر ترويسات الهوية
  عندما يكون `gateway.auth.allowTailscale: true`؛ لا تستخدم نقاط نهاية HTTP API
  مصادقة ترويسة Tailscale هذه، بل تتبع وضع مصادقة HTTP العادي الخاص بـ Gateway.
  يفترض هذا التدفق بلا رموز أن مضيف Gateway موثوق. اضبطه على
  `false` إذا كنت تريد مصادقة السر المشترك في كل مكان.
- تتوقع مصادقة **trusted-proxy** إعدادات وكيل واعٍ بالهوية غير loopback افتراضيًا.
  تتطلب الوكلاء العكسيون loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`.
- تعامل مع تحكم المتصفح مثل وصول المشغل: tailnet فقط + إقران عقد مقصود.

تفصيل معمق: [الأمان](/ar/gateway/security).

### macOS: نفق SSH دائم عبر LaunchAgent

بالنسبة إلى عملاء macOS المتصلين بـ Gateway بعيدة، يستخدم أسهل إعداد دائم إدخال إعداد SSH `LocalForward` مع LaunchAgent لإبقاء النفق حيًا عبر عمليات إعادة التشغيل والانهيارات.

#### الخطوة 1: أضف إعداد SSH

حرر `~/.ssh/config`:

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

خزّن الرمز في الإعدادات حتى يبقى عبر عمليات إعادة التشغيل:

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

سيبدأ النفق تلقائيًا عند تسجيل الدخول، ويُعاد تشغيله عند الانهيار، ويحافظ على المنفذ الممرر نشطًا.

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

| إدخال الإعداد                         | ما يفعله                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | يمرر المنفذ المحلي 18789 إلى المنفذ البعيد 18789             |
| `ssh -N`                             | SSH دون تنفيذ أوامر بعيدة (تمرير المنافذ فقط)                |
| `KeepAlive`                          | يعيد تشغيل النفق تلقائيًا إذا انهار                          |
| `RunAtLoad`                          | يبدأ النفق عندما يتم تحميل LaunchAgent عند تسجيل الدخول      |

## ذات صلة

- [Tailscale](/ar/gateway/tailscale)
- [المصادقة](/ar/gateway/authentication)
- [إعداد Gateway بعيدة](/ar/gateway/remote-gateway-readme)
